import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Dynamic lookup to prevent Next.js build-time inlining of NEXT_PUBLIC_ vars
const env = process.env
const supabaseUrl = (env['NEXT_PUBLIC_SUPABASE_URL'] || env['SUPABASE_URL'])!
const supabaseAnonKey = (env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || env['SUPABASE_ANON_KEY'])!

export async function middleware(request: NextRequest) {
  // If setup isn't complete, skip auth — let the page render the setup wizard
  const geminiKey = process.env.GEMINI_API_KEY
  if (!supabaseUrl || !supabaseAnonKey || !geminiKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 30,
              secure: true,
            })
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getSession().
  // getSession() reads the session from cookies and refreshes expired tokens
  // without making a network request to validate (unlike getUser/getClaims
  // which hit Supabase's /auth/v1/user endpoint and can fail on cold-start).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  // Allow public routes
  const publicPaths = ['/login', '/auth/callback', '/api/setup']
  const isPublic = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // If no session but auth cookies exist, the user was previously signed in.
  // Let the request through — the client-side SupabaseProvider will recover
  // the session via onAuthStateChange / token refresh.
  const hasAuthCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  if (!user && !isPublic && !hasAuthCookies) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
