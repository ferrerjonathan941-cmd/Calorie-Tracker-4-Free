'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignInPage, Testimonial } from '@/components/ui/sign-in'

type Mode = 'signin' | 'signup' | 'reset'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80'

const TESTIMONIALS: Testimonial[] = [
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Emily Rose',
    handle: '@emilyeats',
    text: 'Lost 15 lbs in 3 months just by snapping photos of my meals. The AI accuracy is incredible!',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'James Park',
    handle: '@jamesfit',
    text: "Finally a calorie tracker that doesn't make me manually search for every food. Total game changer.",
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/68.jpg',
    name: 'Sofia Lane',
    handle: '@sofiahealthy',
    text: 'The restaurant recognition is wild — scanned a Chipotle bowl and got perfect macros instantly.',
  },
]

const MODE_COPY: Record<Mode, { title: string; description: string; submit: string; footerText: string; footerLink: string }> = {
  signin: {
    title: 'Welcome back',
    description: 'Sign in to track your calories and stay on top of your goals.',
    submit: 'Sign In',
    footerText: 'New here?',
    footerLink: 'Create Account',
  },
  signup: {
    title: 'Create account',
    description: 'Start tracking your nutrition with AI-powered food analysis.',
    submit: 'Create Account',
    footerText: 'Already have an account?',
    footerLink: 'Sign In',
  },
  reset: {
    title: 'Reset password',
    description: "Enter your email and we'll send you a reset link.",
    submit: 'Send Reset Link',
    footerText: 'Remember it?',
    footerLink: 'Back to Sign In',
  },
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const copy = MODE_COPY[mode]

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a password reset link.')
      }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account.')
      }
      setLoading(false)
      return
    }

    // signin
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleCreateAccount = () => {
    setError(null)
    setMessage(null)
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  const handleResetPassword = () => {
    setError(null)
    setMessage(null)
    setMode('reset')
  }

  const titleNode = (
    <span>
      {loading ? (
        <span className="font-light tracking-tighter">Loading…</span>
      ) : error ? (
        <span className="text-red-400 text-2xl font-normal">{error}</span>
      ) : message ? (
        <span className="text-green-400 text-2xl font-normal">{message}</span>
      ) : (
        <span className="font-light tracking-tighter">{copy.title}</span>
      )}
    </span>
  )

  return (
    <SignInPage
      title={titleNode}
      description={copy.description}
      heroImageSrc={HERO_IMAGE}
      testimonials={TESTIMONIALS}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      submitLabel={loading ? 'Loading…' : copy.submit}
      footerText={copy.footerText}
      footerLinkText={copy.footerLink}
      showPasswordField={mode !== 'reset'}
      showRememberMe={mode === 'signin'}
    />
  )
}
