import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Dashboard from './dashboard'
import { checkSetup } from '@/lib/supabase/check-setup'
import SetupScreen from '@/components/SetupScreen'

// Never statically cache this page — env vars may be set after the first build
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Check if database is configured before anything else
  const setupResult = await checkSetup()
  if (!setupResult.ok) {
    return <SetupScreen reason={setupResult.reason} checks={setupResult.checks} />
  }

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    // If auth cookies exist, the user was previously signed in — render
    // the dashboard shell and let the client-side SupabaseProvider recover
    // the session via token refresh. Only hard-redirect when there are
    // truly no cookies (never logged in or explicitly signed out).
    const cookieStore = await cookies()
    const hasAuthCookies = cookieStore.getAll().some(c => c.name.startsWith('sb-'))
    if (!hasAuthCookies) {
      redirect('/login')
    }
    return <Dashboard initialEntries={[]} userEmail="" />
  }

  // Fetch recent entries (48h window to cover any timezone offset)
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - 48)

  const { data: entries } = await supabase
    .from('food_entries')
    .select('*')
    .gte('logged_at', cutoff.toISOString())
    .order('logged_at', { ascending: false })

  return (
    <Dashboard
      initialEntries={entries || []}
      userEmail={user.email || ''}
    />
  )
}
