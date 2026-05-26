import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin')
  const isAdminArea = request.nextUrl.pathname.startsWith('/admin') || isAdminApi

  if (isAdminArea) {
    if (!user) {
      if (isAdminApi) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
      return NextResponse.redirect(new URL('/login?admin=1', request.url))
    }
    if (user.app_metadata?.role !== 'admin') {
      if (isAdminApi) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
