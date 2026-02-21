import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DailySummary } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const summary = searchParams.get('summary') === 'true'
    const tz = searchParams.get('tz') || 'UTC'

    let query = supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    if (from) query = query.gte('logged_at', from)
    if (to) query = query.lte('logged_at', to)

    const { data: entries, error: dbError } = await query

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    if (summary) {
      // Group by date and compute daily summaries
      const byDate = new Map<string, DailySummary>()

      const dateFmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })

      for (const entry of entries || []) {
        const date = dateFmt.format(new Date(entry.logged_at)) // YYYY-MM-DD in user's timezone
        const existing = byDate.get(date)
        if (existing) {
          existing.total_calories += entry.total_calories
          existing.total_protein += entry.total_protein
          existing.total_carbs += entry.total_carbs
          existing.total_fat += entry.total_fat
          existing.entry_count += 1
        } else {
          byDate.set(date, {
            date,
            total_calories: entry.total_calories,
            total_protein: entry.total_protein,
            total_carbs: entry.total_carbs,
            total_fat: entry.total_fat,
            entry_count: 1,
          })
        }
      }

      const summaries = Array.from(byDate.values()).sort(
        (a, b) => b.date.localeCompare(a.date)
      )

      return NextResponse.json({ summaries })
    }

    return NextResponse.json({ entries: entries || [] })
  } catch (error) {
    console.error('Fetch entries error:', error)
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
    const { image_url, meal_type, food_items, total_calories, total_protein, total_carbs, total_fat, notes, logged_at } = body

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
        logged_at: logged_at || new Date().toISOString(),
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
