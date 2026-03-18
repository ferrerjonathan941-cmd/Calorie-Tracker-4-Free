/**
 * Centralized environment variable access.
 *
 * Supports both the standard names used in .env.example AND the names
 * injected automatically by the Supabase Vercel Integration:
 *
 *   Standard                          Vercel Integration
 *   ────────────────────────────────   ──────────────────────────────────
 *   NEXT_PUBLIC_SUPABASE_URL          NEXT_PUBLIC_SUPABASE_URL  (same)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *   DATABASE_URL                      POSTGRES_URL
 */

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY
}
