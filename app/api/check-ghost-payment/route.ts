import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

const GHOST_AUTH_TOKEN = 'c2tfbGl2ZV9wU3hlaHA5Y2p3MEtMa3d2ZWhwV29XeU5yYklQRVBnNGdOdmJobjl6RFFjZkxUTEY6NzQxYTcyMzEtMjIyMy00NzViLWJiYzItN2VlYzFhOWZmYTFh'
const GHOST_API_URL = "https://api.ghostspaysv2.com/functions/v1"

// Função para gerar credenciais Basic Auth
function getAuthHeader(): string {
  return `Basic ${GHOST_AUTH_TOKEN}`
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

    console.log(`🔍 Consultando transação Ghost Pay: ${transactionId}`)

    const response = await fetch(`${GHOST_API_URL}/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao consultar Ghost Pay:", {
        status: response.status,
        body: errorText
      })
      
      return NextResponse.json({ 
        error: "Erro ao consultar pagamento",
        details: errorText
      }, { status: response.status })
    }

    const result = await response.json()
    console.log(`✅ Status Ghost Pay: ${result.status}`)
    
    // Adaptar resposta
    const adaptedResponse = {
      id: result.id,
      status: mapGhostStatus(result.status),
      amount: result.amount,
      paymentMethod: result.paymentMethod,
      paidAt: result.paidAt,
      createdAt: result.createdAt,
      customer: result.customer,
      pix: result.pix,
    }
    
    return NextResponse.json(adaptedResponse)
  } catch (error) {
    console.error("❌ Erro ao verificar pagamento Ghost Pay:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 })
  }
}

// Mapear status do Ghost Pay para nosso formato
function mapGhostStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'waiting_payment': 'waiting_payment',
    'paid': 'paid',
    'refused': 'refused',
    'canceled': 'refused',
    'refunded': 'refused',
    'chargedback': 'refused',
    'failed': 'refused',
    'expired': 'refused',
    'in_analisys': 'waiting_payment',
    'in_protest': 'waiting_payment',
  }
  
  return statusMap[status?.toLowerCase()] || 'waiting_payment'
}
