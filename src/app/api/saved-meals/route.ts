import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: meals, error } = await supabase
      .from('saved_meals')
      .select('*')
      .eq('user_id', user.id)
      .order('use_count', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch saved meals' }, { status: 500 })
    }

    return NextResponse.json(meals)
  } catch (error) {
    console.error('Saved meals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, meal_type, food_items, total_calories, total_protein, total_carbs, total_fat } = body

    if (!name || !food_items || !Array.isArray(food_items)) {
      return NextResponse.json({ error: 'Name and food items are required' }, { status: 400 })
    }

    const { data: meal, error } = await supabase
      .from('saved_meals')
      .insert({
        user_id: user.id,
        name,
        meal_type: meal_type || 'snack',
        food_items,
        total_calories: Math.round(total_calories),
        total_protein: Math.round(total_protein * 10) / 10,
        total_carbs: Math.round(total_carbs * 10) / 10,
        total_fat: Math.round(total_fat * 10) / 10,
      })
      .select()
      .single()

    if (error) {
      console.error('Save meal error:', error)
      return NextResponse.json({ error: 'Failed to save meal' }, { status: 500 })
    }

    return NextResponse.json(meal)
  } catch (error) {
    console.error('Save meal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
