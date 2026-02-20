import { FoodAnalysis } from '@/lib/types'
import { extractNutritionFromSnippet } from '@/lib/search/brave'

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

export function validateNutrition(
  analysis: FoodAnalysis,
  searchContext?: string
): { warnings: string[]; isValid: boolean } {
  const warnings: string[] = []

  // Check for negative values
  for (const item of analysis.food_items) {
    if (item.calories < 0 || item.protein < 0 || item.carbs < 0 || item.fat < 0) {
      warnings.push(`"${item.name}" has negative nutritional values`)
    }
  }

  // Macro math check: P×4 + C×4 + F×9 ≈ calories (within 25%)
  for (const item of analysis.food_items) {
    if (item.calories === 0) continue
    const calculatedCals = item.protein * 4 + item.carbs * 4 + item.fat * 9
    const ratio = Math.abs(calculatedCals - item.calories) / item.calories
    if (ratio > 0.25) {
      warnings.push(
        `"${item.name}": macros (${Math.round(calculatedCals)} cal) don't match stated calories (${item.calories} cal)`
      )
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

  // Item sum vs total check
  const itemSumCals = analysis.food_items.reduce((sum, item) => sum + item.calories, 0)
  if (analysis.total_calories > 0) {
    const totalDiff = Math.abs(itemSumCals - analysis.total_calories) / analysis.total_calories
    if (totalDiff > 0.05) {
      warnings.push(
        `Item calories sum (${itemSumCals}) doesn't match total (${analysis.total_calories})`
      )
    }
  }

  // Cross-check against search-extracted nutrition values
  if (searchContext) {
    const extracted = extractNutritionFromSnippet(searchContext)
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

  return { warnings, isValid: warnings.length === 0 }
}
