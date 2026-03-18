'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Skip auth listener if Supabase isn't configured (setup wizard is showing)
    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return children
}
