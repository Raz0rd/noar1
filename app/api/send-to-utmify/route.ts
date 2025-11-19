import { type NextRequest, NextResponse } from "next/server"

// Função para obter API Key baseada no domínio
function getUtmifyApiKey(request: NextRequest): string {
  // Usar sempre a mesma key para todos os domínios
  return 'YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Obter API Key dinâmica baseada no domínio
    const apiKey = getUtmifyApiKey(request)

    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "x-api-token": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        error: "Erro ao enviar dados para UTMify",
        status: response.status,
        details: errorText
      }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ 
      error: "Erro ao enviar dados para UTMify",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
