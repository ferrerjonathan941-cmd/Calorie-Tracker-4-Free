import { NextResponse } from 'next/server'

export async function GET() {
  // Only show presence/absence and first 4 chars — never expose full values
  const vars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'POSTGRES_URL',
    'DATABASE_URL',
    'GEMINI_API_KEY',
  ]

  const result: Record<string, string> = {}
  for (const name of vars) {
    const val = process.env[name]
    if (!val) {
      result[name] = 'NOT SET'
    } else {
      result[name] = `SET (${val.length} chars, starts with "${val.slice(0, 8)}...")`
    }
  }

  return NextResponse.json(result)
}
