import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost'
  const path = request.nextUrl.pathname
  
  // Log do domínio que está acessando
  console.log(`🌐 [MIDDLEWARE] Domínio: ${hostname} | Path: ${path}`)
  
  // Adiciona hostname aos headers para uso no servidor
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hostname', hostname)
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
