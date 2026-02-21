import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { FoodItem, FoodAnalysis } from '@/lib/types'

export type { FoodItem, FoodAnalysis }

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface AnalyzeFoodOptions {
  base64Image?: string
  mimeType?: string
  description?: string
  searchContext?: string
  isRestaurant?: boolean
  isChainRestaurant?: boolean
  chainName?: string
}

interface FoodIdentification {
  isFood: boolean
  notFoodReason?: string
  items: string[]
  isChainRestaurant: boolean
  chainName?: string
}

export async function identifyFoodItems(
  base64Image: string,
  mimeType: string
): Promise<FoodIdentification> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0,
      topP: 0.1,
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
    {
      text: `Identify the food items in this image. Return a JSON object with:
{
  "isFood": true/false,
  "notFoodReason": "brief reason if not food, or null",
  "items": ["item name 1", "item name 2"],
  "isChainRestaurant": true/false,
  "chainName": "chain name or null"
}

Rules:
- First determine if the image contains food or beverages. If it does NOT contain any food or drinks, set "isFood" to false, provide a brief friendly reason in "notFoodReason" (e.g. "This looks like a shoe, not food"), and return an empty items array.
- If the image does contain food, set "isFood" to true and "notFoodReason" to null.
- List each distinct food item by name (e.g. "Chick-fil-A spicy chicken sandwich", "french fries")
- If this is from a recognizable chain restaurant (McDonald's, Chick-fil-A, Subway, etc.), set isChainRestaurant to true and provide the chainName
- If you can see packaging, wrappers, or branding, use that to identify the chain
- Keep item names specific — include the chain name if known (e.g. "McDonald's Big Mac" not just "burger")
- Do NOT estimate any nutritional values — only identify what the food items are`,
    },
  ])

  const text = result.response.text().trim()
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  return JSON.parse(cleaned)
}

const JSON_STRUCTURE = `Return a JSON object with this exact structure:
{
  "food_items": [
    {
      "name": "item name",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "quantity": "estimated portion size",
      "category": "one of: fruit, vegetable, grain, protein, dairy, fat, beverage, snack, mixed, condiment, other"
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "needsInput": false
}

Be specific about each food item. Estimate reasonable portion sizes. Round numbers to 1 decimal place for macros and whole numbers for calories.`

function buildCookingContext(isRestaurant: boolean, isChainRestaurant?: boolean): string {
  if (isChainRestaurant) {
    return `\n\nCOOKING CONTEXT: This is a CHAIN RESTAURANT meal. Official nutrition data from chain restaurants ALREADY includes all cooking oils, butter, sauces, and preparation methods. Do NOT add an "Est. cooking oils & sauces" line item — it would double-count calories that are already in the official numbers.`
  }
  if (isRestaurant) {
    return `\n\nCOOKING CONTEXT: This is a RESTAURANT meal. Restaurant portions are typically larger than homemade. Assume generous use of butter, oil, cream, and sauces in preparation. Always include a line item for "Est. cooking oils & sauces" with estimated hidden calories from cooking fats — if the food appears raw/uncooked, set this to 0 calories.`
  }
  return `\n\nCOOKING CONTEXT: This is a HOME-COOKED meal. Assume moderate amounts of cooking oil and seasonings. Always include a line item for "Est. cooking oils & sauces" with estimated hidden calories from cooking fats — if the food appears raw/uncooked, set this to 0 calories.`
}

function buildMixedDishInstructions(): string {
  return `\n\nMIXED DISHES: For bowls, burritos, sandwiches, and composite dishes, break them down into individual ingredient components. Estimate hidden ingredients (rice, beans, sauces, cheese, etc.) even if not fully visible. Set "needsInput" to true ONLY if the image is truly ambiguous and you cannot confidently identify the main ingredients — do NOT set it for well-known dishes like burgers, pizza, sushi, etc.`
}

function buildPortionInstructions(): string {
  return `\n\nPORTION ESTIMATION: Look for reference objects in the image — plates (~10-11 inches), forks, hands, cups, or standard containers for scale. State your portion assumption in the quantity field (e.g., "1 medium plate, ~2 cups"). When in doubt, estimate conservatively.`
}

function buildSearchDirective(searchContext?: string): string {
  if (!searchContext) return ''
  return `${searchContext}

IMPORTANT: You MUST use the nutrition data found above. Use those EXACT numbers for calories, protein, carbs, and fat. Do NOT substitute your own estimates when real data is available. If EXTRACTED VALUES are provided, those are your ground truth.`
}

function buildPrompt(options: AnalyzeFoodOptions): string {
  const { description, searchContext, isRestaurant, isChainRestaurant } = options
  const hasImage = Boolean(options.base64Image)
  const cookingCtx = buildCookingContext(isRestaurant || false, isChainRestaurant)
  const mixedDishCtx = buildMixedDishInstructions()
  const portionCtx = hasImage ? buildPortionInstructions() : ''
  const searchDirective = buildSearchDirective(searchContext)

  if (hasImage && description) {
    return `Analyze this food image. The user describes this meal as: "${description}"

Use the image for visual identification and the description for context.${searchDirective}${cookingCtx}${mixedDishCtx}${portionCtx}

${JSON_STRUCTURE}`
  }

  if (hasImage) {
    return `Analyze this food image and estimate the nutritional content.${searchDirective}${cookingCtx}${mixedDishCtx}${portionCtx}

${JSON_STRUCTURE}`
  }

  return `The user is logging a meal and described it as: "${description}"

Based on this description, estimate the nutritional content for each item.${searchDirective}${cookingCtx}${mixedDishCtx}

${JSON_STRUCTURE}`
}

export async function analyzeFood(options: AnalyzeFoodOptions): Promise<FoodAnalysis> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0,
      topP: 0.1,
      responseMimeType: 'application/json',
    },
  })

  const parts: Part[] = []

  if (options.base64Image && options.mimeType) {
    parts.push({
      inlineData: {
        mimeType: options.mimeType,
        data: options.base64Image,
      },
    })
  }

  parts.push({ text: buildPrompt(options) })

  const result = await model.generateContent(parts)

  const text = result.response.text().trim()
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  const analysis: FoodAnalysis = JSON.parse(cleaned)

  // Ensure numeric values
  analysis.total_calories = Math.round(analysis.total_calories)
  analysis.total_protein = Math.round(analysis.total_protein * 10) / 10
  analysis.total_carbs = Math.round(analysis.total_carbs * 10) / 10
  analysis.total_fat = Math.round(analysis.total_fat * 10) / 10

  analysis.food_items = analysis.food_items.map((item) => ({
    ...item,
    calories: Math.round(item.calories),
    protein: Math.round(item.protein * 10) / 10,
    carbs: Math.round(item.carbs * 10) / 10,
    fat: Math.round(item.fat * 10) / 10,
  }))

  return analysis
}
