import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image_url, meal_type, food_items, total_calories, total_protein, total_carbs, total_fat, notes } = body

    if (!food_items || !Array.isArray(food_items) || food_items.length === 0) {
      return NextResponse.json({ error: 'At least one food item is required' }, { status: 400 })
    }

    const { data: entry, error: dbError } = await supabase
      .from('food_entries')
      .insert({
        user_id: user.id,
        image_url: image_url || null,
        meal_type: meal_type || 'snack',
        food_items,
        total_calories: Math.round(total_calories),
        total_protein: Math.round(total_protein * 10) / 10,
        total_carbs: Math.round(total_carbs * 10) / 10,
        total_fat: Math.round(total_fat * 10) / 10,
        notes: notes || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Save entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
