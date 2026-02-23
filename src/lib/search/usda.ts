import { IdentifiedFoodItem } from '@/lib/types'

export interface USDANutrientProfile {
  fdcId: number
  description: string
  dataType: string
  per100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

export interface USDALookupResult {
  query: string
  match: USDANutrientProfile | null
  confidence: 'high' | 'low' | 'none'
}

// USDA FoodData Central nutrient IDs
const NUTRIENT_IDS = {
  energy: 1008,    // Energy (kcal)
  protein: 1003,   // Protein
  fat: 1004,       // Total lipid (fat)
  carbs: 1005,     // Carbohydrate, by difference
  fiber: 1079,     // Fiber, total dietary
}

interface USDAFoodItem {
  fdcId: number
  description: string
  dataType: string
  foodNutrients: Array<{
    nutrientId: number
    value: number
  }>
}

function extractNutrient(food: USDAFoodItem, nutrientId: number): number {
  const nutrient = food.foodNutrients.find((n) => n.nutrientId === nutrientId)
  return nutrient?.value ?? 0
}

function scoreMatch(description: string, query: string): number {
  const desc = description.toLowerCase()
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  const matchCount = queryWords.filter((word) => desc.includes(word)).length
  const coverageScore = matchCount / queryWords.length
  // Prefer shorter (more generic) descriptions
  const brevityScore = 1 / Math.log(description.length + 2)
  return coverageScore * 0.8 + brevityScore * 0.2
}

function selectBestMatch(foods: USDAFoodItem[], query: string): USDAFoodItem | null {
  if (foods.length === 0) return null

  const scored = foods
    .filter((f) => ['SR Legacy', 'Survey (FNDDS)'].includes(f.dataType))
    .map((food) => ({ food, score: scoreMatch(food.description, query) }))
    .sort((a, b) => b.score - a.score)

  return scored[0]?.food ?? null
}

export async function lookupUSDANutrient(foodName: string): Promise<USDALookupResult> {
  const apiKey = process.env.USDA_API_KEY
  if (!apiKey) {
    return { query: foodName, match: null, confidence: 'none' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
    url.searchParams.set('query', foodName)
    url.searchParams.set('dataType', 'SR Legacy')
    url.searchParams.append('dataType', 'Survey (FNDDS)')
    url.searchParams.set('pageSize', '5')
    url.searchParams.set('api_key', apiKey)

    const res = await fetch(url.toString(), { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) {
      return { query: foodName, match: null, confidence: 'none' }
    }

    const data = await res.json()
    const foods: USDAFoodItem[] = data.foods ?? []

    const best = selectBestMatch(foods, foodName)
    if (!best) {
      return { query: foodName, match: null, confidence: 'none' }
    }

    const calories = extractNutrient(best, NUTRIENT_IDS.energy)
    const protein = extractNutrient(best, NUTRIENT_IDS.protein)
    const carbs = extractNutrient(best, NUTRIENT_IDS.carbs)
    const fat = extractNutrient(best, NUTRIENT_IDS.fat)
    const fiber = extractNutrient(best, NUTRIENT_IDS.fiber)

    const profile: USDANutrientProfile = {
      fdcId: best.fdcId,
      description: best.description,
      dataType: best.dataType,
      per100g: { calories, protein, carbs, fat, fiber },
    }

    // If energy+protein+carbs all == 0: none confidence
    const confidence = (calories === 0 && protein === 0 && carbs === 0) ? 'none' : 'high'

    return { query: foodName, match: profile, confidence }
  } catch {
    clearTimeout(timeout)
    return { query: foodName, match: null, confidence: 'none' }
  }
}

export async function lookupUSDANutrients(
  items: IdentifiedFoodItem[]
): Promise<Map<string, USDALookupResult>> {
  const results = await Promise.all(items.map((item) => lookupUSDANutrient(item.name)))
  const map = new Map<string, USDALookupResult>()
  items.forEach((item, i) => map.set(item.name, results[i]))
  return map
}

export function formatUSDAContextForPrompt(
  items: IdentifiedFoodItem[],
  usdaMap: Map<string, USDALookupResult>
): string {
  if (items.length === 0) return ''

  const lines = items.map((item) => {
    const result = usdaMap.get(item.name)
    if (!result?.match || result.confidence === 'none') {
      return `ITEM: "${item.name}" (estimated: ${item.estimatedWeightG}g)\n  USDA: No match found — use visual estimate`
    }

    const { description, dataType, per100g } = result.match
    const w = item.estimatedWeightG
    const calcCal = Math.round((per100g.calories / 100) * w)
    const calcProt = Math.round((per100g.protein / 100) * w * 10) / 10
    const calcCarbs = Math.round((per100g.carbs / 100) * w * 10) / 10
    const calcFat = Math.round((per100g.fat / 100) * w * 10) / 10

    return [
      `ITEM: "${item.name}" (estimated: ${w}g)`,
      `  USDA MATCH: "${description}" (${dataType})`,
      `  Per 100g: ${per100g.calories} cal | ${per100g.protein}g protein | ${per100g.carbs}g carbs | ${per100g.fat}g fat | ${per100g.fiber}g fiber`,
      `  CALCULATED for ${w}g: ${calcCal} cal | ${calcProt}g protein | ${calcCarbs}g carbs | ${calcFat}g fat`,
    ].join('\n')
  })

  return `\n\nAUTHORITATIVE USDA DATA — use CALCULATED values as your answer (only adjust weight if visual evidence strongly contradicts the Pass 1 estimate):\n\n${lines.join('\n\n')}`
}
