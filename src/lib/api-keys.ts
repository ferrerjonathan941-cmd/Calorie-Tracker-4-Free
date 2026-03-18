import { createClient } from '@/lib/supabase/server'

const ENV_FALLBACKS: Record<string, string | undefined> = {
  usda_api_key: process.env.USDA_API_KEY,
  brave_api_key: process.env.BRAVE_API_KEY,
}

/**
 * Resolve an optional API key: checks user_settings in Supabase first,
 * then falls back to the corresponding environment variable.
 */
export async function getApiKey(
  keyName: 'usda_api_key' | 'brave_api_key',
  userId: string
): Promise<string | undefined> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_settings')
      .select('setting_value')
      .eq('user_id', userId)
      .eq('setting_key', keyName)
      .single()

    if (data?.setting_value) {
      return data.setting_value
    }
  } catch {
    // Table might not exist yet (pre-migration) — fall through to env var
  }

  return ENV_FALLBACKS[keyName]
}
