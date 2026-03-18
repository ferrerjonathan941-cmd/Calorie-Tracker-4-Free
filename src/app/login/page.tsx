'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignInPage } from '@/components/ui/sign-in'

type Mode = 'signin' | 'signup' | 'reset'

const SAFE_AUTH_ERRORS = [
  'Invalid login credentials',
  'Email not confirmed',
  'User already registered',
  'Password should be at least',
  'Email rate limit exceeded',
  'Signups not allowed',
]

function sanitizeAuthError(message: string): string {
  if (SAFE_AUTH_ERRORS.some((safe) => message.includes(safe))) {
    return message
  }
  return 'Something went wrong. Please try again.'
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80'

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

/** Extract the Supabase project ref from the public URL for building dashboard links */
function getProjectRef(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url?.match(/^https:\/\/([^.]+)\.supabase/)?.[1]
}

/** Check if an auth error is likely caused by auth provider misconfiguration */
function isAuthConfigError(errorMessage: string): boolean {
  const patterns = [
    'email logins are disabled',
    'signups not allowed',
    'provider is not enabled',
    'email provider is disabled',
    'new signups are disabled',
    'otp_disabled',
  ]
  const lower = errorMessage.toLowerCase()
  return patterns.some(p => lower.includes(p))
}

/** Check if an auth error is likely a redirect URL issue */
function isRedirectError(errorMessage: string): boolean {
  const patterns = [
    'redirect',
    'not allowed',
    'invalid redirect',
    'redirect_uri',
  ]
  const lower = errorMessage.toLowerCase()
  return patterns.some(p => lower.includes(p))
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
        setError(sanitizeAuthError(error.message))
      } else {
        setMessage('Check your email for a password reset link.')
      }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(sanitizeAuthError(error.message))
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

  // Build contextual help for auth errors
  const ref = getProjectRef()
  const authProvidersUrl = ref
    ? `https://supabase.com/dashboard/project/${ref}/auth/providers`
    : 'https://supabase.com/dashboard'
  const urlConfigUrl = ref
    ? `https://supabase.com/dashboard/project/${ref}/auth/url-configuration`
    : 'https://supabase.com/dashboard'

  let authHelpNode: React.ReactNode = null
  if (error && isAuthConfigError(error)) {
    authHelpNode = (
      <span className="block mt-3 text-sm text-zinc-400 font-normal leading-relaxed">
        Email sign-in may not be enabled yet.{' '}
        <a href={authProvidersUrl} target="_blank" rel="noopener noreferrer" className="text-[#7FFFD4] underline underline-offset-2">
          Open Auth Providers
        </a>
        {' '}in Supabase and toggle <strong className="text-zinc-200">Email</strong> on.
      </span>
    )
  } else if (error && isRedirectError(error)) {
    authHelpNode = (
      <span className="block mt-3 text-sm text-zinc-400 font-normal leading-relaxed">
        Your app&apos;s URL may need to be added to the allowed redirect list.{' '}
        <a href={urlConfigUrl} target="_blank" rel="noopener noreferrer" className="text-[#7FFFD4] underline underline-offset-2">
          Open URL Configuration
        </a>
        {' '}and add:{' '}
        <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs">{window.location.origin}/auth/callback</code>
      </span>
    )
  }

  const titleNode = (
    <span>
      {loading ? (
        <span className="font-light tracking-tighter">Loading…</span>
      ) : error ? (
        <span>
          <span className="text-red-400 text-2xl font-normal">{error}</span>
          {authHelpNode}
        </span>
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

      onSignIn={handleSignIn}

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
