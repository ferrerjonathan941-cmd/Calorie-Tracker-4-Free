import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
              maxAge: 60 * 60 * 24 * 400,
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
  const publicPaths = ['/login', '/auth/callback']
  const isPublic = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Forward cookies from supabaseResponse so stale session cookies are
    // properly cleared. Without this, the browser and server go out of sync
    // and the user's session is terminated prematurely.
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
