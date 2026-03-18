/**
 * Centralized environment variable access.
 *
 * Uses bracket notation (process.env[name]) to prevent Next.js from
 * inlining NEXT_PUBLIC_ values at build time. This is critical for the
 * Vercel deploy button flow where the Supabase integration may set
 * env vars after the build.
 */

// Dynamic lookup — Next.js cannot inline bracket notation with a variable key
function getEnv(name: string): string | undefined {
  return process.env[name] || undefined
}

export function getSupabaseUrl(): string | undefined {
  return getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL')
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    getEnv('SUPABASE_ANON_KEY') ||
    getEnv('SUPABASE_PUBLISHABLE_KEY')
  )
}

export function getDatabaseUrl(): string | undefined {
  return getEnv('DATABASE_URL') || getEnv('POSTGRES_URL')
}

export function getGeminiApiKey(): string | undefined {
  return getEnv('GEMINI_API_KEY')
}
