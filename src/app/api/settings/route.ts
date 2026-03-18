import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_KEYS = ['usda_api_key', 'brave_api_key']

function maskKey(value: string): string {
  if (value.length <= 4) return '****'
  return '****' + value.slice(-4)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select('setting_key, setting_value')
    .eq('user_id', user.id)
    .in('setting_key', ALLOWED_KEYS)

  const result: Record<string, { set: boolean; masked: string | null }> = {}
  for (const key of ALLOWED_KEYS) {
    const row = settings?.find((s) => s.setting_key === key)
    result[key] = row
      ? { set: true, masked: maskKey(row.setting_value) }
      : { set: false, masked: null }
  }

  return NextResponse.json(result)
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(key)) continue

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      // Delete the key
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('setting_key', key)
    } else {
      // Upsert the key
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            setting_key: key,
            setting_value: (value as string).trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,setting_key' }
        )
    }
  }

  return NextResponse.json({ success: true })
}
