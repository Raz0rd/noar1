import { type NextRequest, NextResponse } from "next/server"

// Mesma função de detecção
function getUtmifyApiKey(request: NextRequest): string {
  // Usar sempre a mesma key para todos os domínios
  return 'YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV'
}

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const referer = request.headers.get('referer') || ''
  const origin = request.headers.get('origin') || ''
  
  const apiKey = getUtmifyApiKey(request)
  
  return NextResponse.json({
    success: true,
    detectedDomain: 'Todos os domínios (key unificada)',
    apiKey: apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4),
    headers: {
      host,
      referer,
      origin
    },
    message: '✅ Usando key unificada YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV!'
  })
}
