import { FoodAnalysis, IdentifiedFoodItem } from '@/lib/types'
import { extractNutritionFromSnippet } from '@/lib/search/brave'
import type { USDALookupResult } from '@/lib/search/usda'

const CATEGORY_RANGES: Record<string, { min: number; max: number }> = {
  fruit: { min: 5, max: 200 },
  vegetable: { min: 5, max: 150 },
  grain: { min: 50, max: 800 },
  protein: { min: 30, max: 1200 },
  dairy: { min: 20, max: 600 },
  fat: { min: 40, max: 900 },
  beverage: { min: 0, max: 800 },
  snack: { min: 20, max: 800 },
  mixed: { min: 100, max: 1500 },
  condiment: { min: 2, max: 200 },
  other: { min: 0, max: 2000 },
}

// Category-typical macro ratios (by calorie percentage)
const CATEGORY_MACRO_RATIOS: Record<string, { proteinPct: number; carbsPct: number; fatPct: number }> = {
  protein: { proteinPct: 0.55, carbsPct: 0.05, fatPct: 0.40 },
  fruit: { proteinPct: 0.04, carbsPct: 0.90, fatPct: 0.06 },
  vegetable: { proteinPct: 0.20, carbsPct: 0.70, fatPct: 0.10 },
  grain: { proteinPct: 0.12, carbsPct: 0.75, fatPct: 0.13 },
  dairy: { proteinPct: 0.25, carbsPct: 0.30, fatPct: 0.45 },
  fat: { proteinPct: 0.02, carbsPct: 0.03, fatPct: 0.95 },
  beverage: { proteinPct: 0.05, carbsPct: 0.90, fatPct: 0.05 },
  snack: { proteinPct: 0.10, carbsPct: 0.50, fatPct: 0.40 },
  mixed: { proteinPct: 0.25, carbsPct: 0.40, fatPct: 0.35 },
  condiment: { proteinPct: 0.05, carbsPct: 0.40, fatPct: 0.55 },
  other: { proteinPct: 0.20, carbsPct: 0.45, fatPct: 0.35 },
}

function estimateMacrosFromCalories(
  calories: number,
  category: string
): { protein: number; carbs: number; fat: number } {
  const ratios = CATEGORY_MACRO_RATIOS[category] || CATEGORY_MACRO_RATIOS.other
  return {
    protein: Math.round((calories * ratios.proteinPct) / 4 * 10) / 10,
    carbs: Math.round((calories * ratios.carbsPct) / 4 * 10) / 10,
    fat: Math.round((calories * ratios.fatPct) / 9 * 10) / 10,
  }
}

export function validateNutrition(
  analysis: FoodAnalysis,
  searchContext?: string,
  identifiedItems?: IdentifiedFoodItem[],
  usdaMap?: Map<string, USDALookupResult>
): { warnings: string[]; corrections: string[]; isValid: boolean } {
  const warnings: string[] = []
  const corrections: string[] = []

  // Extract search data once for cross-checks
  const extracted = searchContext ? extractNutritionFromSnippet(searchContext) : undefined

  // Check for negative values
  for (const item of analysis.food_items) {
    if (item.calories < 0 || item.protein < 0 || item.carbs < 0 || item.fat < 0) {
      warnings.push(`"${item.name}" has negative nutritional values`)
    }
  }

  // Absolute meal bounds check
  if (analysis.total_calories < 50 && analysis.total_calories > 0) {
    warnings.push('Total seems too low (<50 kcal)')
  }
  if (analysis.total_calories > 3000) {
    warnings.push('Exceeds 3000 kcal — multiple servings?')
  }
  for (const item of analysis.food_items) {
    const category = item.category || 'other'
    if (item.calories > 1500 && category !== 'mixed') {
      warnings.push(`"${item.name}" (${item.calories} cal) — single ingredient exceeds typical max, check portion`)
    }
  }

  // Caloric density check (physically impossible values)
  if (identifiedItems) {
    for (const item of analysis.food_items) {
      const identified = identifiedItems.find(
        (i) => i.name.toLowerCase() === item.name.toLowerCase()
      )
      if (identified && identified.estimatedWeightG > 0) {
        const density = (item.calories / identified.estimatedWeightG) * 100
        if (density > 900) {
          warnings.push(
            `"${item.name}": caloric density (${Math.round(density)} kcal/100g) exceeds physical maximum of 900 kcal/100g`
          )
        }
      }
    }
  }

  // USDA per-item cross-check (auto-correct if >50% off, warn if >15% off)
  if (usdaMap && identifiedItems) {
    for (const item of analysis.food_items) {
      if (item.autoCorrected) continue
      const identified = identifiedItems.find(
        (i) => i.name.toLowerCase() === item.name.toLowerCase()
      )
      if (!identified) continue

      const usdaResult = usdaMap.get(identified.name)
      if (!usdaResult?.match || usdaResult.confidence === 'none') continue

      const { per100g } = usdaResult.match
      const expectedCalories = (per100g.calories / 100) * identified.estimatedWeightG
      if (expectedCalories === 0) continue

      const calDiff = Math.abs(expectedCalories - item.calories) / expectedCalories

      if (calDiff > 0.50) {
        // Auto-correct to USDA values
        const w = identified.estimatedWeightG
        item.calories = Math.round((per100g.calories / 100) * w)
        item.protein = Math.round((per100g.protein / 100) * w * 10) / 10
        item.carbs = Math.round((per100g.carbs / 100) * w * 10) / 10
        item.fat = Math.round((per100g.fat / 100) * w * 10) / 10
        item.autoCorrected = true
        corrections.push(
          `[Auto-corrected] "${item.name}": calories were >50% off from USDA data — corrected to ${item.calories} cal (USDA: ${usdaResult.match.description})`
        )
      } else if (calDiff > 0.15) {
        warnings.push(
          `"${item.name}": calories (${item.calories}) differ ${Math.round(calDiff * 100)}% from USDA estimate (${Math.round(expectedCalories)} cal)`
        )
      }
    }
  }

  // Macro math check + auto-correction for severe hallucinations
  for (const item of analysis.food_items) {
    if (item.calories === 0) continue
    const calculatedCals = item.protein * 4 + item.carbs * 4 + item.fat * 9
    const ratio = Math.abs(calculatedCals - item.calories) / item.calories

    if (ratio > 0.5) {
      // Severe: macro-calculated calories >50% off from stated calories
      const category = item.category || 'other'

      // Try search data first if it has complete macros
      if (extracted?.protein !== undefined && extracted?.carbs !== undefined && extracted?.fat !== undefined && analysis.food_items.length === 1) {
        item.protein = extracted.protein
        item.carbs = extracted.carbs
        item.fat = extracted.fat
        if (extracted.calories !== undefined) {
          item.calories = extracted.calories
        }
        item.autoCorrected = true
        corrections.push(
          `[Auto-corrected] "${item.name}": macros were wildly incorrect (${Math.round(calculatedCals)} cal from macros vs ${item.calories} cal stated) — replaced with search data values`
        )
      } else {
        // Estimate from calories using category ratios
        const estimated = estimateMacrosFromCalories(item.calories, category)
        item.protein = estimated.protein
        item.carbs = estimated.carbs
        item.fat = estimated.fat
        item.autoCorrected = true
        corrections.push(
          `[Auto-corrected] "${item.name}": macros were wildly incorrect (${Math.round(calculatedCals)} cal from macros vs ${item.calories} cal stated) — estimated from calories using typical ${category} ratios`
        )
      }
    } else if (ratio > 0.25) {
      warnings.push(
        `"${item.name}": macros (${Math.round(calculatedCals)} cal) don't match stated calories (${item.calories} cal)`
      )
    }
  }

  // Search data cross-check for single-item meals (>30% calorie difference)
  if (extracted?.calories !== undefined && analysis.food_items.length === 1) {
    const item = analysis.food_items[0]
    if (item.calories > 0 && !item.autoCorrected) {
      const calDiff = Math.abs(extracted.calories - item.calories) / extracted.calories
      if (calDiff > 0.3) {
        item.calories = extracted.calories
        if (extracted.protein !== undefined) item.protein = extracted.protein
        if (extracted.carbs !== undefined) item.carbs = extracted.carbs
        if (extracted.fat !== undefined) item.fat = extracted.fat
        item.autoCorrected = true
        corrections.push(
          `[Auto-corrected] "${item.name}": calories differed >30% from search data — corrected to ${extracted.calories} cal`
        )
      }
    }
  }

  // Category range check
  for (const item of analysis.food_items) {
    const category = item.category || 'other'
    const range = CATEGORY_RANGES[category] || CATEGORY_RANGES.other
    if (item.calories < range.min || item.calories > range.max) {
      warnings.push(
        `"${item.name}" (${item.calories} cal) seems unusual for ${category} (typical: ${range.min}-${range.max} cal)`
      )
    }
  }

  // Zero-calorie non-beverage check
  for (const item of analysis.food_items) {
    const category = item.category || 'other'
    if (item.calories === 0 && category !== 'beverage') {
      warnings.push(`"${item.name}" has 0 calories — is this correct?`)
    }
  }

  // Item sum vs total check (and recalculate totals if corrections were made)
  if (corrections.length > 0) {
    analysis.total_calories = analysis.food_items.reduce((sum, item) => sum + item.calories, 0)
    analysis.total_protein = Math.round(analysis.food_items.reduce((sum, item) => sum + item.protein, 0) * 10) / 10
    analysis.total_carbs = Math.round(analysis.food_items.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10
    analysis.total_fat = Math.round(analysis.food_items.reduce((sum, item) => sum + item.fat, 0) * 10) / 10
    analysis.correctionCount = corrections.length
  }

  const itemSumCals = analysis.food_items.reduce((sum, item) => sum + item.calories, 0)
  if (analysis.total_calories > 0) {
    const totalDiff = Math.abs(itemSumCals - analysis.total_calories) / analysis.total_calories
    if (totalDiff > 0.05) {
      warnings.push(
        `Item calories sum (${itemSumCals}) doesn't match total (${analysis.total_calories})`
      )
    }
  }

  // Cross-check against search-extracted nutrition values (warnings only for multi-item meals)
  if (extracted && analysis.food_items.length > 1) {
    if (extracted.calories !== undefined && analysis.total_calories > 0) {
      const calDiff = Math.abs(extracted.calories - analysis.total_calories) / extracted.calories
      if (calDiff > 0.3) {
        warnings.push(
          `Analysis calories (${analysis.total_calories}) differ >30% from search data (${extracted.calories} cal)`
        )
      }
    }
    if (extracted.protein !== undefined && analysis.total_protein > 0) {
      const protDiff = Math.abs(extracted.protein - analysis.total_protein) / extracted.protein
      if (protDiff > 0.3) {
        warnings.push(
          `Analysis protein (${analysis.total_protein}g) differs >30% from search data (${extracted.protein}g)`
        )
      }
    }
  }

  return { warnings, corrections, isValid: warnings.length === 0 && corrections.length === 0 }
}
