import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from './dashboard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    redirect('/login')
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
