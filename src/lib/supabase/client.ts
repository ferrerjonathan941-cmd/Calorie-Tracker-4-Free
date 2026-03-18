import { createBrowserClient } from '@supabase/ssr'

// Note: these env vars are inlined at build time by Next.js (NEXT_PUBLIC_ prefix).
// The Supabase Vercel Integration may set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// instead of NEXT_PUBLIC_SUPABASE_ANON_KEY.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Use a placeholder URL/key when not configured so the client library doesn't
// throw at import time. The setup wizard will be shown instead of any auth flow.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder'

export function createClient() {
  return createBrowserClient(
    supabaseUrl || PLACEHOLDER_URL,
    supabaseAnonKey || PLACEHOLDER_KEY,
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
    }
  )
}
