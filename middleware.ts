import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost'
  const path = request.nextUrl.pathname
  
  // Log do domínio que está acessando
  console.log(`🌐 [MIDDLEWARE] Domínio: ${hostname} | Path: ${path}`)
  
  // Capturar UTMs e parâmetros de tracking
  const searchParams = request.nextUrl.searchParams
  const utms = {
    utm_source: searchParams.get('utm_source') || undefined,
    utm_medium: searchParams.get('utm_medium') || undefined,
    utm_campaign: searchParams.get('utm_campaign') || undefined,
    utm_content: searchParams.get('utm_content') || undefined,
    utm_term: searchParams.get('utm_term') || undefined,
    gclid: searchParams.get('gclid') || undefined,
    fbclid: searchParams.get('fbclid') || undefined,
    gbraid: searchParams.get('gbraid') || undefined,
    wbraid: searchParams.get('wbraid') || undefined,
  }
  
  // Verificar se tem algum UTM ou parâmetro de tracking
  const hasTracking = Object.values(utms).some(value => value !== undefined)
  
  // Se tiver tracking, registrar primeiro acesso (async, não bloqueia a requisição)
  if (hasTracking) {
    const ip = request.headers.get('x-real-ip') || 
                request.headers.get('x-forwarded-for')?.split(',')[0] || 
                'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''
    
    // Log dos dados capturados
    console.log(`📊 [MIDDLEWARE] Primeiro acesso detectado: ${hostname} | IP: ${ip} | UTMs:`, JSON.stringify(utms))
    
    // Enviar para API de logs (fire and forget) - usando localhost para evitar problemas de DNS
    try {
      fetch(`http://localhost:3001/api/access-logs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Host': hostname // Manter o hostname original
        },
        body: JSON.stringify({
          domain: hostname,
          ip,
          userAgent,
          path,
          utms,
          referrer
        })
      }).catch(err => {
        console.error('❌ [MIDDLEWARE] Erro ao salvar log:', err.message)
      })
    } catch (err: any) {
      console.error('❌ [MIDDLEWARE] Erro ao enviar log:', err.message)
    }
  }
  
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
