'use client'

import { useState, useEffect, useCallback } from 'react'

interface MigrationResult {
  name: string
  success: boolean
  error?: string
}

interface Props {
  reason?: string
  checks?: {
    supabaseConfigured: boolean
    supabaseConnected: boolean
    geminiConfigured: boolean
    databaseReady: boolean
    supabaseProjectRef?: string
  }
}

type MigrationStatus = 'idle' | 'running' | 'success' | 'error' | 'manual'

// ── Icons ─────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin shrink-0" />
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function DashboardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-400 underline underline-offset-2 hover:text-blue-300"
    >
      {children}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

/** Build a Supabase dashboard URL from a project ref */
function dashboardUrl(ref: string | undefined, path: string) {
  if (!ref) return `https://supabase.com/dashboard${path}`
  return `https://supabase.com/dashboard/project/${ref}${path}`
}

// ── Step Row ──────────────────────────────────────────────────────────────

function StepRow({
  label,
  passed,
  active,
  children,
}: {
  label: string
  passed: boolean
  active?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5">
        {passed ? <CheckIcon /> : active ? <Spinner /> : <XIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${passed ? 'text-green-400' : 'text-white'}`}>
          {label}
        </p>
        {!passed && children && (
          <div className="mt-1.5 text-sm text-zinc-400 leading-relaxed">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export default function SetupScreen({ reason, checks }: Props) {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>('idle')
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([])
  const [migrationError, setMigrationError] = useState('')

  const ref = checks?.supabaseProjectRef
  const supabaseOk = !!(checks?.supabaseConfigured && checks?.supabaseConnected)
  const geminiOk = !!checks?.geminiConfigured
  const dbOk = !!checks?.databaseReady || migrationStatus === 'success'
  const coreReady = supabaseOk && geminiOk && dbOk

  const runMigration = useCallback(async () => {
    setMigrationStatus('running')
    setMigrationError('')

    try {
      const res = await fetch('/api/setup', { method: 'POST' })
      const data = await res.json()

      if (data.needsManualSetup) {
        setMigrationStatus('manual')
        return
      }

      if (data.success) {
        setMigrationStatus('success')
        setMigrationResults(data.results || [])
      } else {
        setMigrationStatus('error')
        setMigrationResults(data.results || [])
        const failed = (data.results || []).filter((r: MigrationResult) => !r.success)
        setMigrationError(
          failed.length > 0
            ? `Migration failed at: ${failed.map((r: MigrationResult) => r.name).join(', ')}`
            : 'Database setup failed.'
        )
      }
    } catch {
      setMigrationStatus('error')
      setMigrationError('Could not reach the setup API. Check your deployment logs.')
    }
  }, [])

  // Auto-run migration when the only issue is missing tables
  useEffect(() => {
    if (reason === 'needs_migration' && migrationStatus === 'idle') {
      runMigration()
    }
  }, [reason, migrationStatus, runMigration])

  // Auto-reload when core setup passes (auth is informational, not blocking)
  useEffect(() => {
    if (coreReady) {
      const timer = setTimeout(() => window.location.reload(), 2000)
      return () => clearTimeout(timer)
    }
  }, [coreReady])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
      <div className="max-w-lg w-full">
        <p className="text-zinc-500 text-xs tracking-wide uppercase mb-6 text-center">
          First-time setup &mdash; this only happens once
        </p>

        <h1 className="text-2xl font-bold text-center mb-8">Calorie Tracker Setup</h1>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 divide-y divide-zinc-800/60">
          {/* ── Step 1: Supabase Connection ──────────────────────────── */}
          <StepRow label="Supabase Connection" passed={supabaseOk}>
            {geminiOk ? (
              <>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-amber-400 font-medium text-sm">
                    Deployed via Vercel? You just need to redeploy.
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Supabase sets its environment variables <em>after</em> the first build, so the
                    first deploy always shows this screen. Go to your Vercel dashboard &rarr;{' '}
                    <strong>Deployments</strong> &rarr; click the <strong>&hellip;</strong> menu on the
                    latest deployment &rarr; <strong>Redeploy</strong>.
                  </p>
                </div>
                <div className="mt-3 text-zinc-500 text-xs">
                  <p className="font-medium text-zinc-400">Not using Vercel&apos;s deploy button?</p>
                  <p className="mt-1">Add these environment variables manually:</p>
                  <ul className="mt-1 space-y-1">
                    <li>
                      <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-200">NEXT_PUBLIC_SUPABASE_URL</code>
                    </li>
                    <li>
                      <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                    </li>
                  </ul>
                  <p className="mt-1.5">
                    Find these at{' '}
                    <DashboardLink href="https://supabase.com/dashboard">
                      Supabase Dashboard
                    </DashboardLink>
                    {' '}&rarr; your project &rarr; Settings &rarr; API.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p>
                  Your Supabase environment variables are missing. Add them in your hosting
                  provider&apos;s settings:
                </p>
                <ul className="mt-2 space-y-1">
                  <li>
                    <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-200">NEXT_PUBLIC_SUPABASE_URL</code>
                  </li>
                  <li>
                    <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                  </li>
                </ul>
                <p className="mt-2 text-zinc-500 text-xs">
                  Find these at{' '}
                  <DashboardLink href="https://supabase.com/dashboard">
                    Supabase Dashboard
                  </DashboardLink>
                  {' '}&rarr; your project &rarr; Settings &rarr; API.
                </p>
              </>
            )}
          </StepRow>

          {/* ── Step 2: Gemini AI ────────────────────────────────────── */}
          <StepRow label="Gemini AI" passed={geminiOk}>
            <p>
              Add your Gemini API key to your environment variables:
            </p>
            <p className="mt-1">
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-200">GEMINI_API_KEY</code>
            </p>
            <p className="mt-2">
              Get a free key at{' '}
              <DashboardLink href="https://aistudio.google.com/apikey">
                Google AI Studio
              </DashboardLink>
              {' '}&mdash; sign in with Google, click &ldquo;Create API Key&rdquo;, and copy it.
            </p>
          </StepRow>

          {/* ── Step 3: Database Tables ──────────────────────────────── */}
          <StepRow
            label="Database Tables"
            passed={dbOk}
            active={migrationStatus === 'running'}
          >
            {migrationStatus === 'idle' && !supabaseOk && (
              <p className="text-zinc-500">Waiting for Supabase connection first.</p>
            )}

            {migrationStatus === 'running' && (
              <p>Setting up your database&hellip;</p>
            )}

            {migrationStatus === 'error' && (
              <div className="space-y-2">
                <p className="text-red-400">{migrationError}</p>
                {migrationResults.length > 0 && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1 text-xs">
                    {migrationResults.map((r) => (
                      <div key={r.name} className="flex items-center gap-2">
                        <span className={r.success ? 'text-green-400' : 'text-red-400'}>
                          {r.success ? '\u2713' : '\u2717'}
                        </span>
                        <span className="text-zinc-300">{r.name}</span>
                        {r.error && (
                          <span className="text-zinc-500 ml-auto truncate max-w-[50%]">{r.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={runMigration}
                  className="text-xs text-blue-400 underline underline-offset-2 hover:text-blue-300"
                >
                  Retry migration
                </button>
              </div>
            )}

            {migrationStatus === 'manual' && (
              <div className="space-y-2">
                <p className="text-amber-400">
                  Auto-setup needs a database connection string to create tables.
                </p>
                <div className="bg-zinc-800/50 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-medium text-white">Option 1: Add the connection string</p>
                  <p className="text-zinc-400">
                    Go to{' '}
                    <DashboardLink href={dashboardUrl(ref, '/settings/database')}>
                      Database Settings
                    </DashboardLink>
                    {' '}&rarr; Connection string &rarr; URI. Copy it and add it as{' '}
                    <code className="bg-zinc-800 px-1 py-0.5 rounded">DATABASE_URL</code> in your
                    hosting settings. Then click Re-check below.
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-medium text-white">Option 2: Run the SQL manually</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-zinc-400">
                    <li>
                      Open the{' '}
                      <DashboardLink href={dashboardUrl(ref, '/sql/new')}>
                        SQL Editor
                      </DashboardLink>
                    </li>
                    <li>Copy everything from <code className="bg-zinc-800 px-1 py-0.5 rounded">supabase-setup.sql</code> in the repo</li>
                    <li>Paste it into the editor and click &ldquo;Run&rdquo;</li>
                    <li>Click &ldquo;Re-check&rdquo; below</li>
                  </ol>
                </div>
              </div>
            )}

            {migrationStatus === 'idle' && supabaseOk && reason !== 'needs_migration' && (
              <p className="text-zinc-500">Database tables not found.</p>
            )}
          </StepRow>

          {/* ── Step 4: Ready to Go ──────────────────────────────────── */}
          <StepRow label="Ready to Go" passed={coreReady}>
            {!coreReady && (
              <p className="text-zinc-500">Complete the steps above to finish setup.</p>
            )}
          </StepRow>

          {coreReady && (
            <div className="pt-3 text-center">
              <p className="text-green-400 text-sm font-medium">
                Setup complete! Redirecting&hellip;
              </p>
            </div>
          )}
        </div>

        {/* Re-check button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition-colors"
          >
            Re-check
          </button>
        </div>
      </div>
    </div>
  )
}
