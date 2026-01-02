import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cpfApiKey = process.env.CPF_API_KEY
    
    if (!cpfApiKey) {
      return NextResponse.json({ active: false, reason: 'no_key' })
    }

    // Testa a API com um CPF fictício apenas para ver se responde
    const apiUrl = `http://74.50.76.90:7000/${cpfApiKey}/cpf/00000000000`
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
    })
    
    clearTimeout(timeout)

    // Se retornar 404, API está offline
    if (response.status === 404) {
      return NextResponse.json({ active: false, reason: 'api_offline' })
    }

    // Qualquer outra resposta (200, 400, etc) significa que a API está online
    return NextResponse.json({ active: true })

  } catch (error: any) {
    console.error('❌ [CPF-HEALTH] Erro ao verificar API:', error.message)
    return NextResponse.json({ active: false, reason: 'error', message: error.message })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
