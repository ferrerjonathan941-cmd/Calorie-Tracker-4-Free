import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Dashboard from './dashboard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch today's entries
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: entries } = await supabase
    .from('food_entries')
    .select('*')
    .gte('logged_at', today.toISOString())
    .order('logged_at', { ascending: false })

  return (
    <Dashboard
      initialEntries={entries || []}
      userEmail={user.email || ''}
    />
  )
}
