import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Find entries older than 7 days that still have images
    const { data: entries, error: queryError } = await supabase
      .from('food_entries')
      .select('id, image_url')
      .eq('user_id', user.id)
      .lt('logged_at', sevenDaysAgo.toISOString())
      .not('image_url', 'is', null)

    if (queryError || !entries || entries.length === 0) {
      return NextResponse.json({ cleaned: 0 })
    }

    // Extract storage paths from public URLs
    const paths = entries
      .map((e) => {
        const match = e.image_url?.match(/\/food-photos\/(.+)$/)
        return match ? match[1] : null
      })
      .filter((p): p is string => p !== null)

    if (paths.length > 0) {
      // Batch delete files from storage
      await supabase.storage.from('food-photos').remove(paths)
    }

    // Set image_url to null on those entries
    const ids = entries.map((e) => e.id)
    await supabase
      .from('food_entries')
      .update({ image_url: null })
      .in('id', ids)

    return NextResponse.json({ cleaned: paths.length })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
