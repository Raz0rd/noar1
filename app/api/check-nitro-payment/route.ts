import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

function getApiToken(): string {
  const token = process.env.NITRO_API_TOKEN
  if (!token) {
    throw new Error('NITRO_API_TOKEN não configurado')
  }
  return token
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🔍 [DEBUG] Consultando transação Nitro Pay: ${transactionId}`)

    const apiToken = getApiToken()
    const nitroUrl = `https://api.nitropagamentos.com/api/public/v1/transactions/${transactionId}?api_token=${apiToken}`
    
    console.log('📡 [DEBUG] Request para Nitro Pay:')
    console.log('   - URL:', nitroUrl.replace(apiToken, '***'))
    console.log('   - Method: GET')
    
    const response = await fetch(nitroUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [DEBUG] Erro ao consultar Nitro Pay:")
      console.error('   - Status:', response.status)
      console.error('   - Status Text:', response.statusText)
      console.error('   - Body:', errorText)

      return NextResponse.json({ 
        error: "Erro ao consultar pagamento",
        details: errorText,
        status: response.status
      }, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ [DEBUG] Resposta bem-sucedida Nitro Pay:')
    console.log('   - Transaction Hash:', result.hash || result.id)
    console.log('   - Status:', result.payment_status || result.status)
    console.log('   - Amount:', result.amount)
    
    const adaptedResponse = {
      id: result.hash || result.id,
      status: mapNitroStatus(result.payment_status || result.status),
      amount: result.amount
    }
    
    return NextResponse.json(adaptedResponse, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento Nitro Pay:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function mapNitroStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'waiting_payment': 'waiting_payment',
    'pending': 'waiting_payment',
    'paid': 'paid',
    'approved': 'paid',
    'refused': 'refused',
    'canceled': 'refused',
    'refunded': 'refused',
    'chargedback': 'refused',
    'failed': 'refused',
    'expired': 'refused',
  }
  
  return statusMap[status?.toLowerCase()] || 'waiting_payment'
}
