import { createClient } from './server'
import { getSupabaseUrl, getSupabaseAnonKey, getGeminiApiKey } from '@/lib/env'

export interface SetupResult {
  ok: boolean
  reason?: string
  /** Individual service checks for the setup wizard */
  checks?: {
    supabaseConfigured: boolean
    supabaseConnected: boolean
    geminiConfigured: boolean
    databaseReady: boolean
    /** Supabase project ref extracted from the URL, for building dashboard deep links */
    supabaseProjectRef?: string
  }
}

/**
 * Checks whether the database tables exist by attempting a lightweight query.
 * Called server-side from page.tsx before rendering.
 */
export async function checkSetup(): Promise<SetupResult> {
  try {
    // If Supabase env vars are missing, the createClient call will throw
    if (!getSupabaseUrl() || !getSupabaseAnonKey()) {
      return {
        ok: false,
        reason: 'missing_env',
        checks: {
          supabaseConfigured: false,
          supabaseConnected: false,
          geminiConfigured: !!getGeminiApiKey(),
          databaseReady: false,
        },
      }
    }

    const geminiConfigured = !!getGeminiApiKey()

    // Extract project ref from URL (e.g. "abcdefg" from "https://abcdefg.supabase.co")
    const supabaseProjectRef = getSupabaseUrl()?.match(/^https:\/\/([^.]+)\.supabase/)?.[1]

    const supabase = await createClient()
    const { error } = await supabase
      .from('food_entries')
      .select('id')
      .limit(0)

    if (error) {
      // PostgREST returns 404 or a message containing "relation" when table doesn't exist
      if (
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.code === '42P01'
      ) {
        return {
          ok: false,
          reason: 'needs_migration',
          checks: {
            supabaseConfigured: true,
            supabaseConnected: true,
            geminiConfigured,
            databaseReady: false,
            supabaseProjectRef,
          },
        }
      }
      // Other errors (e.g. network) — still not ready
      return {
        ok: false,
        reason: 'connection_error',
        checks: {
          supabaseConfigured: true,
          supabaseConnected: false,
          geminiConfigured,
          databaseReady: false,
          supabaseProjectRef,
        },
      }
    }

    // Database is ready — but if Gemini is missing, still show setup wizard
    if (!geminiConfigured) {
      return {
        ok: false,
        reason: 'missing_gemini',
        checks: {
          supabaseConfigured: true,
          supabaseConnected: true,
          geminiConfigured: false,
          databaseReady: true,
          supabaseProjectRef,
        },
      }
    }

    return {
      ok: true,
      checks: {
        supabaseConfigured: true,
        supabaseConnected: true,
        geminiConfigured: true,
        databaseReady: true,
        supabaseProjectRef,
      },
    }
  } catch {
    return {
      ok: false,
      reason: 'missing_env',
      checks: {
        supabaseConfigured: false,
        supabaseConnected: false,
        geminiConfigured: !!getGeminiApiKey(),
        databaseReady: false,
      },
    }
  }
}
