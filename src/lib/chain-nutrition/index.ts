import { FoodItem, FoodAnalysis } from '@/lib/types'
import { chains, ChainData, ChainItem } from './data'
import { parseModifier } from './modifiers'

export interface ChainMatchResult {
  chain: ChainData
  matchedItems: { chainItem: ChainItem; multiplier: number; originalName: string }[]
  unmatchedItemNames: string[]
  isFullMatch: boolean
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[-]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchChain(chainName: string): ChainData | null {
  const normalized = normalize(chainName)
  for (const chain of chains) {
    for (const alias of chain.aliases) {
      if (normalized.includes(normalize(alias)) || normalize(alias).includes(normalized)) {
        return chain
      }
    }
  }
  return null
}

function matchItemToChain(
  chain: ChainData,
  baseName: string
): ChainItem | null {
  const normalized = normalize(baseName)
  if (!normalized) return null

  // Exact alias match
  for (const item of chain.items) {
    for (const alias of item.aliases) {
      if (normalize(alias) === normalized) {
        return item
      }
    }
  }

  // Exact name match
  for (const item of chain.items) {
    if (normalize(item.name) === normalized) {
      return item
    }
  }

  // Substring match: input contains an alias
  for (const item of chain.items) {
    for (const alias of item.aliases) {
      const normAlias = normalize(alias)
      if (normAlias.length >= 3 && normalized.includes(normAlias)) {
        return item
      }
    }
  }

  // Substring match: an alias contains the input (for short inputs like "rice")
  for (const item of chain.items) {
    for (const alias of item.aliases) {
      const normAlias = normalize(alias)
      if (normalized.length >= 3 && normAlias.includes(normalized)) {
        return item
      }
    }
  }

  return null
}

export function matchItems(
  chain: ChainData,
  identifiedItems: string[]
): ChainMatchResult {
  const matched: ChainMatchResult['matchedItems'] = []
  const unmatched: string[] = []

  for (const rawItem of identifiedItems) {
    const parsed = parseModifier(rawItem)

    if (parsed.multiplier === 0) {
      // "No X" / "Without X" — skip entirely
      continue
    }

    const chainItem = matchItemToChain(chain, parsed.baseName)
    if (chainItem) {
      matched.push({
        chainItem,
        multiplier: parsed.multiplier,
        originalName: parsed.originalName,
      })
    } else {
      unmatched.push(rawItem)
    }
  }

  return {
    chain,
    matchedItems: matched,
    unmatchedItemNames: unmatched,
    isFullMatch: unmatched.length === 0 && matched.length > 0,
  }
}

function applyMultiplier(item: ChainItem, multiplier: number): FoodItem {
  return {
    name: multiplier !== 1 ? `${multiplier === 2 ? 'Extra ' : multiplier + 'x '}${item.name}` : item.name,
    calories: Math.round(item.calories * multiplier),
    protein: Math.round(item.protein * multiplier * 10) / 10,
    carbs: Math.round(item.carbs * multiplier * 10) / 10,
    fat: Math.round(item.fat * multiplier * 10) / 10,
    quantity: item.quantity,
    category: item.category,
  }
}

export function buildChainAnalysis(
  result: ChainMatchResult,
  aiAnalysis?: FoodAnalysis
): FoodAnalysis {
  const foodItems: FoodItem[] = result.matchedItems.map(({ chainItem, multiplier }) =>
    applyMultiplier(chainItem, multiplier)
  )

  // Merge unmatched items from AI analysis if available
  if (aiAnalysis && result.unmatchedItemNames.length > 0) {
    foodItems.push(...aiAnalysis.food_items)
  }

  const total_calories = foodItems.reduce((sum, item) => sum + item.calories, 0)
  const total_protein = Math.round(foodItems.reduce((sum, item) => sum + item.protein, 0) * 10) / 10
  const total_carbs = Math.round(foodItems.reduce((sum, item) => sum + item.carbs, 0) * 10) / 10
  const total_fat = Math.round(foodItems.reduce((sum, item) => sum + item.fat, 0) * 10) / 10

  return {
    food_items: foodItems,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
  }
}
