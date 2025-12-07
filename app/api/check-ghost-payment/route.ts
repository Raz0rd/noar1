import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// Função para gerar credenciais Basic Auth
function getAuthHeader(): string {
  const secretKey = process.env.GHOSTPAY_API_KEY
  const companyId = process.env.GHOSTPAY_COMPANY_ID
  
  console.log('🔑 [DEBUG] Credenciais Ghost Pay:')
  console.log('   - Secret Key:', secretKey ? `${secretKey.substring(0, 10)}...` : 'UNDEFINED')
  console.log('   - Company ID:', companyId ? `${companyId.substring(0, 8)}...` : 'UNDEFINED')
  
  const credentials = `${secretKey}:${companyId}`
  const base64Credentials = Buffer.from(credentials).toString('base64')
  
  console.log('   - Base64:', base64Credentials.substring(0, 20) + '...')
  
  return `Basic ${base64Credentials}`
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

    console.log(`🔍 [DEBUG] Consultando transação Ghost Pay: ${transactionId}`)

    const ghostpayUrl = `https://api.ghostspaysv2.com/functions/v1/transactions/${transactionId}`
    const authHeader = getAuthHeader()
    
    console.log('📡 [DEBUG] Request para Ghost Pay:')
    console.log('   - URL:', ghostpayUrl)
    console.log('   - Method: GET')
    console.log('   - Authorization:', authHeader.substring(0, 30) + '...')
    
    const response = await fetch(ghostpayUrl, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      cache: 'no-store', // Desabilitar cache
      next: { revalidate: 0 } // Revalidar sempre
    })
    



    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [DEBUG] Erro ao consultar Ghost Pay:")
      console.error('   - Status:', response.status)
      console.error('   - Status Text:', response.statusText)
      console.error('   - Body:', errorText)
      console.error('   - URL usada:', ghostpayUrl)
      console.error('   - Auth Header:', authHeader.substring(0, 30) + '...')

      return NextResponse.json({ 
        error: "Erro ao consultar pagamento",
        details: errorText,
        status: response.status,
        url: ghostpayUrl
      }, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ [DEBUG] Resposta bem-sucedida Ghost Pay:')
    console.log('   - Transaction ID:', result.id)
    console.log('   - Status:', result.status)
    console.log('   - Amount:', result.amount)
    console.log('   - Payment Method:', result.paymentMethod)
    
    // Retornar apenas dados essenciais para o client
    const adaptedResponse = {
      id: result.id,
      status: mapGhostStatus(result.status),
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
