import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeFood, identifyFoodItems } from '@/lib/ai/analyze-food'
import { validateNutrition } from '@/lib/ai/validate-nutrition'
import { searchNutritionFacts, formatSearchContextForPrompt } from '@/lib/search/brave'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const mealType = (formData.get('mealType') as string) || 'snack'
    const description = (formData.get('description') as string) || ''
    const draftMode = formData.get('draftMode') === 'true'
    const isRestaurant = formData.get('isRestaurant') === 'true'

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
    let identifiedItems: string[] = []

    // Handle image upload when present
    if (image) {
      const bytes = await image.arrayBuffer()
      base64 = Buffer.from(bytes).toString('base64')
      mimeType = image.type

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

      const { data: { publicUrl: url } } = supabase.storage
        .from('food-photos')
        .getPublicUrl(fileName)

      publicUrl = url
    }

    // Search for nutrition facts
    let searchContext = ''
    if (description.trim()) {
      // Text provided: search using the user's description
      const contexts = await searchNutritionFacts(description)
      searchContext = formatSearchContextForPrompt(contexts)
    } else if (identifiedItems.length > 0) {
      // Image-only: search using identified food names from Pass 1
      const contexts = await searchNutritionFacts(identifiedItems.join(', '))
      searchContext = formatSearchContextForPrompt(contexts)
    }

    // Analyze with Gemini (Pass 2: full analysis with image + search context)
    const analysis = await analyzeFood({
      base64Image: base64,
      mimeType,
      description: description.trim() || undefined,
      searchContext: searchContext || undefined,
      isRestaurant,
      isChainRestaurant,
      chainName,
    })

    // Validate nutrition (cross-check against search data if available)
    const { warnings } = validateNutrition(analysis, searchContext || undefined)
    analysis.warnings = warnings

    // Draft mode: return analysis without saving
    if (draftMode) {
      return NextResponse.json({
        analysis,
        warnings,
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
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Failed to analyze food' }, { status: 500 })
  }
}
