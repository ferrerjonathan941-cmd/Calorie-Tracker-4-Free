import { NextResponse } from 'next/server'
import { checkSetup } from '@/lib/supabase/check-setup'
import { migrations } from '@/lib/supabase/migrations'

export async function GET() {
  const result = await checkSetup()
  if (result.ok) {
    return NextResponse.json({ ready: true })
  }
  // Don't expose specific failure reasons to unauthenticated callers
  return NextResponse.json({ ready: false })
}

export async function POST(request: Request) {
  // Security: prevent unauthorized re-running of migrations.
  // First-time setup (DB not yet configured) always works.
  // Re-running on an already-configured DB requires SETUP_SECRET.
  const setupSecret = process.env.SETUP_SECRET
  const auth = request.headers.get('Authorization')
  const hasValidSecret = setupSecret && auth === `Bearer ${setupSecret}`

  const setupResult = await checkSetup()
  if (setupResult.ok && !hasValidSecret) {
    // DB already set up — require SETUP_SECRET to re-run
    if (setupSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Database is already set up. To re-run migrations, configure SETUP_SECRET.' },
      { status: 403 }
    )
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!databaseUrl) {
    return NextResponse.json(
      {
        error: 'DATABASE_URL is not set. Add it to your environment variables to enable auto-setup, or run the SQL manually in the Supabase SQL Editor.',
        needsManualSetup: true,
      },
      { status: 400 }
    )
  }

  // Dynamic import — the `postgres` package is only needed for migrations
  const postgres = (await import('postgres')).default
  const sql = postgres(databaseUrl, { ssl: 'prefer', connect_timeout: 10 })

  const results: { name: string; success: boolean; error?: string }[] = []

  try {
    for (const step of migrations) {
      try {
        await sql.unsafe(step.sql)
        results.push({ name: step.name, success: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        results.push({ name: step.name, success: false, error: message })
      }
    }
  } finally {
    await sql.end()
  }

  const allSuccess = results.every((r) => r.success)

  return NextResponse.json(
    { success: allSuccess, results },
    { status: allSuccess ? 200 : 500 }
  )
}
