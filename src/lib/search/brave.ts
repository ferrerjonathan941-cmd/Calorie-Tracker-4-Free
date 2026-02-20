interface BraveSearchResult {
  title: string
  description: string
  url: string
}

interface NutritionSearchContext {
  item: string
  results: BraveSearchResult[]
}

export function parseFoodItems(description: string): string[] {
  const items = description
    .split(/,|\band\b|\bwith\b|&/)
    .map((item) => item.trim())
    .map((item) => item.replace(/^(?:a|an|the|some|one|two|three|four|five)\s+/i, ''))
    .filter((item) => item.length > 0)

  return items.slice(0, 5)
}

async function braveWebSearch(
  query: string,
  apiKey: string,
  count = 3
): Promise<BraveSearchResult[]> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', String(count))

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  })

  if (!res.ok) {
    throw new Error(`Brave search failed: ${res.status}`)
  }

  const data = await res.json()
  const webResults = data.web?.results ?? []

  return webResults.map((r: { title?: string; description?: string; url?: string }) => ({
    title: r.title ?? '',
    description: r.description ?? '',
    url: r.url ?? '',
  }))
}

export async function searchNutritionFacts(
  description: string
): Promise<NutritionSearchContext[]> {
  const apiKey = process.env.BRAVE_API_KEY
  if (!apiKey) {
    return []
  }

  const items = parseFoodItems(description)
  const contexts: NutritionSearchContext[] = []

  for (const item of items) {
    try {
      const results = await braveWebSearch(
        `${item} nutrition facts calories protein carbs fat`,
        apiKey
      )
      contexts.push({ item, results })
    } catch (err) {
      console.error(`Brave search failed for "${item}":`, err)
      contexts.push({ item, results: [] })
    }
  }

  return contexts
}

export interface ExtractedNutrition {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export function extractNutritionFromSnippet(text: string): ExtractedNutrition {
  const result: ExtractedNutrition = {}

  const calMatch = text.match(/(\d{2,4})\s*(?:cal(?:ories)?|kcal)/i)
  if (calMatch) result.calories = parseInt(calMatch[1], 10)

  const proteinMatch = text.match(/(\d{1,3}(?:\.\d)?)\s*g\s*(?:of\s+)?protein/i)
  if (proteinMatch) result.protein = parseFloat(proteinMatch[1])

  const carbMatch = text.match(/(\d{1,3}(?:\.\d)?)\s*g\s*(?:of\s+)?(?:carb(?:ohydrate)?s?|total carb)/i)
  if (carbMatch) result.carbs = parseFloat(carbMatch[1])

  const fatMatch = text.match(/(\d{1,3}(?:\.\d)?)\s*g\s*(?:of\s+)?(?:total\s+)?fat/i)
  if (fatMatch) result.fat = parseFloat(fatMatch[1])

  return result
}

export function formatSearchContextForPrompt(
  contexts: NutritionSearchContext[]
): string {
  if (contexts.length === 0) return ''

  const lines = contexts
    .filter((ctx) => ctx.results.length > 0)
    .map((ctx) => {
      const resultLines = ctx.results
        .map((r) => `  - ${r.title}: ${r.description}`)
        .join('\n')

      // Extract nutrition values from all snippets for this item
      const allText = ctx.results.map((r) => `${r.title} ${r.description}`).join(' ')
      const extracted = extractNutritionFromSnippet(allText)
      const extractedParts: string[] = []
      if (extracted.calories !== undefined) extractedParts.push(`${extracted.calories} cal`)
      if (extracted.protein !== undefined) extractedParts.push(`${extracted.protein}g protein`)
      if (extracted.carbs !== undefined) extractedParts.push(`${extracted.carbs}g carbs`)
      if (extracted.fat !== undefined) extractedParts.push(`${extracted.fat}g fat`)

      const extractedLine = extractedParts.length > 0
        ? `\n  >> EXTRACTED VALUES: ${extractedParts.join(', ')}`
        : ''

      return `"${ctx.item}":\n${resultLines}${extractedLine}`
    })

  if (lines.length === 0) return ''

  return `\n\nNUTRITION DATA FROM WEB SEARCH (use these as your primary source — do NOT override with your own estimates when these values are available):\n\n${lines.join('\n\n')}`
}
