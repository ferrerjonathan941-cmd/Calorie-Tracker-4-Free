import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeFood, identifyFoodItems, identifyMissedFoodItems } from '@/lib/ai/analyze-food'
import { validateNutrition } from '@/lib/ai/validate-nutrition'
import { searchNutritionFacts, formatSearchContextForPrompt } from '@/lib/search/brave'
import { lookupUSDANutrients, formatUSDAContextForPrompt } from '@/lib/search/usda'
import type { USDALookupResult } from '@/lib/search/usda'
import { matchChain, matchItems, buildChainAnalysis } from '@/lib/chain-nutrition'
import type { IdentifiedFoodItem } from '@/lib/types'
import { rateLimit } from '@/lib/rate-limit'
import { validateImageUpload } from '@/lib/validation'
import { getGeminiApiKey } from '@/lib/env'

// 10 analyses per user per minute
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

export async function POST(request: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json(
      { error: 'Food scanning is not configured. Please add your GEMINI_API_KEY in your environment variables.' },
      { status: 503 }
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success } = rateLimit(`analyze:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const mealType = (formData.get('mealType') as string) || 'snack'
    const description = (formData.get('description') as string) || ''
    const draftMode = formData.get('draftMode') === 'true'
    const isRestaurant = formData.get('isRestaurant') === 'true'
    const findMissed = formData.get('findMissed') === 'true'

    // ─── Find Missed Items Branch ───
    if (findMissed && image) {
      try {
        const existingItemNames: string[] = JSON.parse(
          (formData.get('existingItems') as string) || '[]'
        )

        const bytes = await image.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mimeType = image.type

        const { items: newItems } = await identifyMissedFoodItems(
          base64,
          mimeType,
          existingItemNames,
          description.trim() || undefined
        )

        if (newItems.length === 0) {
          return NextResponse.json({ analysis: null, warnings: [], noNewItems: true })
        }

        // USDA + Brave parallel lookup for new items only
        const [usdaResult, braveContexts] = await Promise.all([
          lookupUSDANutrients(newItems),
          searchNutritionFacts(newItems.map((i) => i.name).join(', ')),
        ])
        const usdaContext = formatUSDAContextForPrompt(newItems, usdaResult)
        const searchContext = formatSearchContextForPrompt(braveContexts)

        // Pass 2: analyze only the new items
        const analysis = await analyzeFood({
          base64Image: base64,
          mimeType,
          description: description.trim() || undefined,
          usdaContext: usdaContext || undefined,
          searchContext: searchContext || undefined,
          identifiedItems: newItems,
          existingItemNames,
          isRestaurant: false,
        })

        const { warnings, corrections } = validateNutrition(
          analysis,
          searchContext || undefined,
          newItems,
          usdaResult
        )
        analysis.warnings = warnings
        analysis.corrections = corrections

        return NextResponse.json({
          analysis,
          warnings: [...corrections, ...warnings],
          noNewItems: false,
        })
      } catch (missedError) {
        console.error('Find missed error:', missedError)
        const message = missedError instanceof Error ? missedError.message : ''
        if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
          return NextResponse.json({ error: 'You\'ve run out of free credits — please upgrade your Gemini API plan or try again later' }, { status: 429 })
        }
        return NextResponse.json({ error: 'Failed to re-scan for missed items' }, { status: 500 })
      }
    }

    if (!image && !description.trim()) {
      return NextResponse.json(
        { error: 'Please provide an image or food description' },
        { status: 400 }
      )
    }

    let base64: string | undefined
    let mimeType: string | undefined
    let publicUrl: string | null = null
    let isChainRestaurant = false
    let chainName: string | undefined
    let identifiedItems: IdentifiedFoodItem[] = []

    // Handle image upload when present
    if (image) {
      const bytes = await image.arrayBuffer()
      base64 = Buffer.from(bytes).toString('base64')
      mimeType = image.type
      console.log(`[analyze] Image: ${image.name}, type=${mimeType}, size=${bytes.byteLength} bytes, base64=${base64.length} chars`)

      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

      // For image-only uploads: run upload and food identification in parallel
      if (!description.trim()) {
        const [uploadResult, identification] = await Promise.all([
          supabase.storage
            .from('food-photos')
            .upload(fileName, image, {
              contentType: image.type,
              upsert: false,
            }),
          identifyFoodItems(base64, mimeType),
        ])

        if (uploadResult.error) {
          console.error('Upload error:', uploadResult.error)
          return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
        }

        console.log(`[analyze] Pass 1 result:`, JSON.stringify({ isFood: identification.isFood, isChain: identification.isChainRestaurant, chainName: identification.chainName, itemCount: identification.items?.length, items: identification.items?.map(i => i.name) }))

        if (!identification.isFood) {
          // Clean up the uploaded image
          await supabase.storage.from('food-photos').remove([fileName])
          return NextResponse.json(
            { error: identification.notFoodReason || 'This doesn\'t appear to be food. Please take a photo of your meal.' },
            { status: 400 }
          )
        }

        isChainRestaurant = identification.isChainRestaurant
        chainName = identification.chainName || undefined
        identifiedItems = identification.items
      } else {
        // Image + description: just upload
        const { error: uploadError } = await supabase.storage
          .from('food-photos')
          .upload(fileName, image, {
            contentType: image.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
        }
      }

      // Use signed URL (7-day expiry — images are cleaned up after 7 days)
      // NOTE: Set the food-photos bucket to PRIVATE in Supabase dashboard
      const { data: signedData } = await supabase.storage
        .from('food-photos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7)

      publicUrl = signedData?.signedUrl ?? null
    }

    // ─── Chain Nutrition Lookup ───
    // Try to match against hardcoded chain data before falling through to AI
    if (isChainRestaurant && chainName && identifiedItems.length > 0) {
      const chain = matchChain(chainName)
      console.log(`[analyze] Chain lookup: chainName="${chainName}", matched=${!!chain}`)
      if (chain) {
        const result = matchItems(chain, identifiedItems.map((i) => i.name))
        console.log(`[analyze] Chain match: fullMatch=${result.isFullMatch}, matched=${result.matchedItems.map(m => m.chainItem.name)}, unmatched=${result.unmatchedItemNames}`)

        if (result.isFullMatch) {
          // Full match: build analysis entirely from chain data, skip AI
          const analysis = buildChainAnalysis(result)
          const { warnings, corrections } = validateNutrition(analysis)
          analysis.warnings = warnings
          analysis.corrections = corrections

          if (draftMode) {
            return NextResponse.json({
              analysis,
              warnings: [...corrections, ...warnings],
              image_url: publicUrl,
              meal_type: mealType,
              notes: description.trim() || null,
            })
          }

          const { data: entry, error: dbError } = await supabase
            .from('food_entries')
            .insert({
              user_id: user.id,
              image_url: publicUrl,
              meal_type: mealType,
              food_items: analysis.food_items,
              total_calories: analysis.total_calories,
              total_protein: analysis.total_protein,
              total_carbs: analysis.total_carbs,
              total_fat: analysis.total_fat,
              notes: description.trim() || null,
            })
            .select()
            .single()

          if (dbError) {
            console.error('DB error:', dbError)
            return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
          }

          return NextResponse.json(entry)
        }

        if (result.matchedItems.length > 0) {
          // Partial match: use AI only for unmatched items, then merge
          let searchContext = ''
          const contexts = await searchNutritionFacts(result.unmatchedItemNames.join(', '))
          searchContext = formatSearchContextForPrompt(contexts)

          const aiAnalysis = await analyzeFood({
            base64Image: base64,
            mimeType,
            description: result.unmatchedItemNames.join(', '),
            searchContext: searchContext || undefined,
            isRestaurant: true,
            isChainRestaurant: true,
            chainName,
            existingItemNames: result.matchedItems.map(m => m.chainItem.name),
          })

          const analysis = buildChainAnalysis(result, aiAnalysis)
          const { warnings, corrections } = validateNutrition(analysis, searchContext || undefined)
          analysis.warnings = warnings
          analysis.corrections = corrections

          if (draftMode) {
            return NextResponse.json({
              analysis,
              warnings: [...corrections, ...warnings],
              image_url: publicUrl,
              meal_type: mealType,
              notes: description.trim() || null,
            })
          }

          const { data: entry, error: dbError } = await supabase
            .from('food_entries')
            .insert({
              user_id: user.id,
              image_url: publicUrl,
              meal_type: mealType,
              food_items: analysis.food_items,
              total_calories: analysis.total_calories,
              total_protein: analysis.total_protein,
              total_carbs: analysis.total_carbs,
              total_fat: analysis.total_fat,
              notes: description.trim() || null,
            })
            .select()
            .single()

          if (dbError) {
            console.error('DB error:', dbError)
            return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
          }

          return NextResponse.json(entry)
        }
      }
    }

    // ─── USDA + Brave parallel lookup ───
    let usdaMap: Map<string, USDALookupResult> | undefined
    let usdaContext = ''
    let searchContext = ''

    if (identifiedItems.length > 0) {
      // PARALLEL: USDA + Brave lookups simultaneously
      const [usdaResult, braveContexts] = await Promise.all([
        lookupUSDANutrients(identifiedItems),
        searchNutritionFacts(identifiedItems.map((i) => i.name).join(', ')),
      ])
      usdaMap = usdaResult
      usdaContext = formatUSDAContextForPrompt(identifiedItems, usdaMap)
      searchContext = formatSearchContextForPrompt(braveContexts)
    } else if (description.trim()) {
      // Text-only or image+description: Brave only (no identifiedItems to look up)
      const contexts = await searchNutritionFacts(description)
      searchContext = formatSearchContextForPrompt(contexts)
    }

    // Analyze with Gemini (Pass 2: full analysis with image + USDA + search context)
    const analysis = await analyzeFood({
      base64Image: base64,
      mimeType,
      description: description.trim() || undefined,
      usdaContext: usdaContext || undefined,
      searchContext: searchContext || undefined,
      identifiedItems: identifiedItems.length > 0 ? identifiedItems : undefined,
      isRestaurant,
      isChainRestaurant,
      chainName,
    })

    // Validate nutrition (cross-check against USDA + search data if available)
    const { warnings, corrections } = validateNutrition(
      analysis,
      searchContext || undefined,
      identifiedItems.length > 0 ? identifiedItems : undefined,
      usdaMap
    )
    analysis.warnings = warnings
    analysis.corrections = corrections

    // Draft mode: return analysis without saving
    if (draftMode) {
      return NextResponse.json({
        analysis,
        warnings: [...corrections, ...warnings],
        image_url: publicUrl,
        meal_type: mealType,
        notes: description.trim() || null,
      })
    }

    // Save to database (legacy auto-save fallback)
    const { data: entry, error: dbError } = await supabase
      .from('food_entries')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        meal_type: mealType,
        food_items: analysis.food_items,
        total_calories: analysis.total_calories,
        total_protein: analysis.total_protein,
        total_carbs: analysis.total_carbs,
        total_fat: analysis.total_fat,
        notes: description.trim() || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const stack = error instanceof Error ? error.stack : ''
    console.error(`[analyze] FATAL: message="${message}", stack=${stack}, raw=`, error)
    if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'You\'ve run out of free credits — please upgrade your Gemini API plan or try again later' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to analyze food' }, { status: 500 })
  }
}
