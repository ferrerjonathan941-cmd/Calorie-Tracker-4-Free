import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { FoodItem, FoodAnalysis, IdentifiedFoodItem } from '@/lib/types'

export type { FoodItem, FoodAnalysis }

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const EXPERT_SYSTEM_INSTRUCTION = `You are a Registered Dietitian with 15 years of clinical experience and deep expertise in the USDA FoodData Central database.

CALORIC DENSITY REFERENCE (kcal per 100g):
- Leafy vegetables: 14-25 | Non-starchy veg: 25-45 | Starchy veg: 75-90
- Fresh fruit: 45-80 | Cooked grains (rice, pasta): 110-150 | Bread: 230-280
- Lean protein (chicken breast, fish): 100-165 | Fatty protein (beef, salmon): 150-300
- Eggs: 145-155 | Cheese: 300-400 | Nuts/seeds: 550-650 | Oils/butter: 717-900

When USDA data is provided, treat it as authoritative ground truth. Your task is to confirm or adjust the weight estimate from visual evidence, then the pre-calculated nutrition follows automatically.`

interface AnalyzeFoodOptions {
  base64Image?: string
  mimeType?: string
  description?: string
  searchContext?: string
  usdaContext?: string
  identifiedItems?: IdentifiedFoodItem[]
  isRestaurant?: boolean
  isChainRestaurant?: boolean
  chainName?: string
  existingItemNames?: string[]
}

interface FoodIdentification {
  isFood: boolean
  notFoodReason?: string
  items: IdentifiedFoodItem[]
  isChainRestaurant: boolean
  chainName?: string
  isOrderReceipt?: boolean
}

export async function identifyFoodItems(
  base64Image: string,
  mimeType: string
): Promise<FoodIdentification> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
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
  "items": [{ "name": string, "estimatedWeightG": number, "category": string }],
  "isChainRestaurant": true/false,
  "chainName": "chain name or null",
  "isOrderReceipt": true/false
}

Rules:
- First determine if the image contains food, beverages, OR a food order/receipt. If it does NOT contain any food, drinks, or food orders, set "isFood" to false, provide a brief friendly reason in "notFoodReason" (e.g. "This looks like a shoe, not food"), and return an empty items array.
- ORDER/RECEIPT SCREENSHOTS: If the image shows a food delivery order screen (DoorDash, Uber Eats, Grubhub, Postmates), a restaurant receipt, or an order confirmation, this IS valid food — set "isFood" to true and "isOrderReceipt" to true. Extract each food item listed on the order/receipt into the items array.
- If the image does contain food (or is an order/receipt), set "isFood" to true and "notFoodReason" to null.
- List each distinct food item by name (e.g. "grilled chicken breast", "white rice cooked")
- If this is from a recognizable chain restaurant (McDonald's, Chick-fil-A, Subway, Chipotle, etc.), set isChainRestaurant to true and provide the chainName
- If you can see packaging, wrappers, branding, or app logos, use that to identify the chain
- BUILD-YOUR-OWN CHAINS (Chipotle, Subway, etc.): List each individual ingredient/component separately, NOT as one combined item.
- Include modifiers as part of the item name: "Extra Chicken", "Double Steak", "No Sour Cream", "Light Cheese"
- Keep item names specific — include the chain name if known for fixed-menu items (e.g. "McDonald's Big Mac" not just "burger")
- Do NOT estimate any nutritional values — only identify what the food items are

WEIGHT ESTIMATION: For each item, estimate its weight in grams using plate size (25-28cm standard dinner plate) and these heuristics:
- Palm of hand = 85-115g protein | Fist = ~1 cup (~200g cooked) | Cupped hand = ½ cup | Thumb = 1 tablespoon
- Typical: chicken breast 150-170g, burger patty 85-115g, 1 cup cooked rice 180-200g, 1 egg 50g, slice of bread 30g
- Be conservative rather than overestimating

category must be one of: fruit, vegetable, grain, protein, dairy, fat, beverage, snack, mixed, condiment, other`,
    },
  ])

  const text = result.response.text().trim()
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  const parsed = JSON.parse(cleaned)

  // Backward-compat: if items is array of strings (shouldn't happen but safety net)
  if (parsed.items && parsed.items.length > 0 && typeof parsed.items[0] === 'string') {
    parsed.items = parsed.items.map((name: string) => ({
      name,
      estimatedWeightG: 150,
      category: 'other',
    }))
  }

  return parsed
}

export async function identifyMissedFoodItems(
  base64Image: string,
  mimeType: string,
  existingItemNames: string[],
  userHint?: string
): Promise<{ items: IdentifiedFoodItem[] }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0,
      topP: 0.1,
      responseMimeType: 'application/json',
    },
  })

  const existingList = existingItemNames.map((n) => `- ${n}`).join('\n')
  const hintBlock = userHint
    ? `\n\nUSER HINT: The user says they see "${userHint}" — use this as a strong signal for what to look for.`
    : ''

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
    {
      text: `Look at this food image again. The following items have ALREADY been identified — do NOT include them again:
${existingList}

Your job is to find any ADDITIONAL food or drink items that were missed in the first scan. Look carefully for:
- Drinks (cups, glasses, bottles, cans) that may be partially hidden
- Side dishes, sauces, condiments, or dips
- Items behind or next to the main dish
- Bread, rolls, or garnishes${hintBlock}

Return a JSON object:
{
  "items": [{ "name": string, "estimatedWeightG": number, "category": string }]
}

Rules:
- Return ONLY newly found items — never re-list existing items
- If nothing new is found, return { "items": [] }
- category must be one of: fruit, vegetable, grain, protein, dairy, fat, beverage, snack, mixed, condiment, other

WEIGHT ESTIMATION: For each item, estimate its weight in grams using plate size (25-28cm standard dinner plate) and these heuristics:
- Palm of hand = 85-115g protein | Fist = ~1 cup (~200g cooked) | Cupped hand = ½ cup | Thumb = 1 tablespoon
- Be conservative rather than overestimating`,
    },
  ])

  const text = result.response.text().trim()
  const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  const parsed = JSON.parse(cleaned)

  // Safety net for unexpected format
  if (parsed.items && parsed.items.length > 0 && typeof parsed.items[0] === 'string') {
    parsed.items = parsed.items.map((name: string) => ({
      name,
      estimatedWeightG: 150,
      category: 'other',
    }))
  }

  return { items: parsed.items || [] }
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

function buildNutritionContext(usdaContext?: string, searchContext?: string): string {
  let ctx = ''

  if (usdaContext) {
    ctx += usdaContext
    ctx += '\n\nINSTRUCTION: Use the CALCULATED USDA values above as your primary answer for calories and macros. Only adjust the weight estimate if visual evidence strongly contradicts the Pass 1 estimate. The nutrition follows automatically from weight × USDA per-100g values.'
  }

  if (searchContext) {
    if (usdaContext) {
      ctx += `\n\nSUPPLEMENTAL WEB DATA (for items not in USDA above):\n${searchContext}`
    } else {
      ctx += `${searchContext}\n\nIMPORTANT: You MUST use the nutrition data found above. Use those EXACT numbers for calories, protein, carbs, and fat. Do NOT substitute your own estimates when real data is available. If EXTRACTED VALUES are provided, those are your ground truth.`
    }
  }

  return ctx
}

function buildExistingItemsExclusion(existingItemNames?: string[]): string {
  if (!existingItemNames || existingItemNames.length === 0) return ''
  const list = existingItemNames.map((n) => `- ${n}`).join('\n')
  return `\n\nIMPORTANT — ONLY analyze the NEW items listed below. The following items have already been analyzed and must NOT appear in your response:\n${list}\n\nDo NOT include any of the above items in your food_items array. Only return nutrition for the newly identified items.`
}

function buildPrompt(options: AnalyzeFoodOptions): string {
  const { description, searchContext, usdaContext, isRestaurant, isChainRestaurant, existingItemNames } = options
  const hasImage = Boolean(options.base64Image)
  const cookingCtx = buildCookingContext(isRestaurant || false, isChainRestaurant)
  const mixedDishCtx = buildMixedDishInstructions()
  const portionCtx = hasImage ? buildPortionInstructions() : ''
  const nutritionCtx = buildNutritionContext(usdaContext, searchContext)
  const exclusionCtx = buildExistingItemsExclusion(existingItemNames)

  if (hasImage && description) {
    return `Analyze this food image. The user describes this meal as: "${description}"

Use the image for visual identification and the description for context.${nutritionCtx}${cookingCtx}${mixedDishCtx}${portionCtx}${exclusionCtx}

${JSON_STRUCTURE}`
  }

  if (hasImage) {
    return `Analyze this food image and estimate the nutritional content.${nutritionCtx}${cookingCtx}${mixedDishCtx}${portionCtx}${exclusionCtx}

${JSON_STRUCTURE}`
  }

  return `The user is logging a meal and described it as: "${description}"

Based on this description, estimate the nutritional content for each item.${nutritionCtx}${cookingCtx}${mixedDishCtx}${exclusionCtx}

${JSON_STRUCTURE}`
}

export async function analyzeFood(options: AnalyzeFoodOptions): Promise<FoodAnalysis> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: EXPERT_SYSTEM_INSTRUCTION,
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
