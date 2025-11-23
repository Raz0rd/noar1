import { type NextRequest, NextResponse } from "next/server"

const NITRO_AUTH_TOKEN = 'c2tfbGl2ZV9yRGJEZXhXSzlNNHJOdHNyRGJEZXhXSzlNNHJOdHM=' // Base64 encoded
const NITRO_API_URL = "https://api.nitropagamentos.com/api/public/v1"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID é obrigatório" },
        { status: 400 }
      )
    }

    console.log(`🔍 [Nitro] Consultando transação: ${transactionId}`)

    // Decodificar token Base64
    const apiKey = Buffer.from(NITRO_AUTH_TOKEN, 'base64').toString('utf-8')

    const response = await fetch(`${NITRO_API_URL}/transactions/${transactionId}?api_token=${apiKey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    })

    if (!response.ok) {
      console.error(`❌ [Nitro] Erro na API: ${response.status}`)
      return NextResponse.json(
        { error: `Erro na API Nitro: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Mapear status do Nitro para nosso padrão
    // Nitro usa: waiting_payment, paid, refused, canceled, expired
    const status = data.payment_status?.toLowerCase() || 'waiting_payment'
    
    console.log(`✅ [Nitro] Status atual: ${status}`)

    return NextResponse.json({
      id: transactionId,
      status: status,
      amount: data.amount,
      paidAt: data.paid_at || null,
      createdAt: data.created_at || null
    })

  } catch (error) {
    console.error('❌ [Nitro] Erro ao consultar status:', error)
    return NextResponse.json(
      { error: "Erro ao consultar status do pagamento" },
      { status: 500 }
    )
  }
}
