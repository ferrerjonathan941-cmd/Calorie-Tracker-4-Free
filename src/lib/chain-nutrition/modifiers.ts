export interface ParsedItem {
  baseName: string
  multiplier: number
  originalName: string
}

const MODIFIER_PATTERNS: { pattern: RegExp; multiplier: number }[] = [
  { pattern: /^(?:no|without|hold(?: the)?)\s+/i, multiplier: 0 },
  { pattern: /^(?:light|half|lite)\s+/i, multiplier: 0.5 },
  { pattern: /^(?:extra|double|2x)\s+/i, multiplier: 2 },
  { pattern: /^(?:triple|3x)\s+/i, multiplier: 3 },
]

export function parseModifier(itemName: string): ParsedItem {
  const trimmed = itemName.trim()

  for (const { pattern, multiplier } of MODIFIER_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      return {
        baseName: trimmed.slice(match[0].length).trim(),
        multiplier,
        originalName: trimmed,
      }
    }
  }

  return {
    baseName: trimmed,
    multiplier: 1,
    originalName: trimmed,
  }
}
