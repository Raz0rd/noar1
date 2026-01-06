import { type NextRequest, NextResponse } from "next/server"

const NITRO_API_URL = "https://api.nitropagamentos.com/api"

function getApiToken(): string {
  const token = process.env.NITRO_API_TOKEN
  if (!token) {
    throw new Error('NITRO_API_TOKEN não configurado')
  }
  return token
}

function getOfferHash(): string {
  const hash = process.env.NITRO_OFFER_HASH
  if (!hash) {
    throw new Error('NITRO_OFFER_HASH não configurado')
  }
  return hash
}

function getProductHash(): string {
  const hash = process.env.NITRO_PRODUCT_HASH
  if (!hash) {
    throw new Error('NITRO_PRODUCT_HASH não configurado')
  }
  return hash
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("📤 Criando transação Nitro Pay:", JSON.stringify(body, null, 2))

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const webhookUrl = `${protocol}://${host}/api/webhook/nitro`

    const offerHash = getOfferHash()
    const productHash = getProductHash()
    
    console.log("🔑 [DEBUG] Hashes configurados:")
    console.log("   - Product Hash:", productHash)
    console.log("   - Offer Hash:", offerHash)
    
    const nitroPayload = {
      amount: body.amount,
      offer_hash: offerHash,
      payment_method: "pix",
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone_number: body.customer.phone.replace(/\D/g, ''),
        document: body.customer.document.number || body.customer.document,
        street_name: body.billing?.street || body.customer.address?.street || body.shipping?.address?.street || "",
        number: body.billing?.streetNumber || body.customer.address?.streetNumber || body.shipping?.address?.streetNumber || "sn",
        complement: body.billing?.complement || body.customer.address?.complement || body.shipping?.address?.complement || "",
        neighborhood: body.billing?.neighborhood || body.customer.address?.neighborhood || body.shipping?.address?.neighborhood || "",
        city: body.billing?.city || body.customer.address?.city || body.shipping?.address?.city || "",
        state: body.billing?.state || body.customer.address?.state || body.shipping?.address?.state || "",
        zip_code: (body.billing?.zipCode || body.customer.address?.zipCode || body.shipping?.address?.zipCode || "").replace(/\D/g, ''),
      },
      cart: body.items.map((item: any) => ({
        product_hash: productHash,
        title: item.title || "Produto",
        cover: null,
        price: item.unitPrice,
        quantity: item.quantity || 1,
        operation_type: 1,
        tangible: false
      })),
      installments: 1,
      expire_in_days: 1,
      postback_url: webhookUrl
    }

    console.log("📦 Nitro Pay Payload:", JSON.stringify(nitroPayload, null, 2))

    const apiToken = getApiToken()
    const response = await fetch(`${NITRO_API_URL}/public/v1/transactions?api_token=${apiToken}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nitroPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro Nitro Pay Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      
      let errorMessage = "Erro ao criar transação"
      
      if (response.status === 401) {
        errorMessage = "Erro de autenticação. Verifique as credenciais."
      } else if (response.status === 400) {
        errorMessage = "Dados inválidos. Verifique as informações."
      } else if (response.status >= 500) {
        errorMessage = "Serviço temporariamente indisponível."
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: errorText,
        status: response.status
      }, { status: response.status })
    }

    const result = await response.json()
    console.log("✅ Transação Nitro Pay criada:", JSON.stringify(result, null, 2))
    console.log("🔍 [DEBUG] Estrutura completa da resposta:")
    console.log("   - result.hash:", result.hash)
    console.log("   - result.status:", result.status)
    console.log("   - result.pix:", JSON.stringify(result.pix))
    console.log("   - result.payment:", JSON.stringify(result.payment))
    console.log("   - result.transaction:", JSON.stringify(result.transaction))
    console.log("   - Todas as chaves:", Object.keys(result))
    
    console.log('🚀 [GAS API] Iniciando envio para API do Gas...')
    try {
      const { sendToGasAPI, buildGasPayload } = await import('@/lib/gas-api')
      console.log('✅ [GAS API] Módulo gas-api importado com sucesso')
      
      const orderData = {
        amount: body.amount,
        customer: body.customer,
        products: body.items,
        trackingParameters: body.metadata?.trackingParameters || {}
      }
      
      const gasPayload = buildGasPayload(
        result.hash || result.id,
        "pending",
        orderData,
        result,
        host,
        result.pix_qrcode || result.qrcode,
        "nitro"
      )
      
      console.log('📦 [GAS API] Payload construído:', JSON.stringify(gasPayload, null, 2))
      await sendToGasAPI(gasPayload)
    } catch (gasError) {
      console.error('❌ [GAS API] Erro ao enviar PENDING:', gasError)
      console.error('❌ [GAS API] Stack trace:', gasError instanceof Error ? gasError.stack : 'N/A')
    }
    
    const qrcodeData = result.pix?.pix_qr_code || result.pix?.qrcode || result.pix?.emv || result.pix_qrcode || result.qrcode || result.emv || ""
    
    const adaptedResponse = {
      id: result.hash || result.id,
      status: mapNitroStatus(result.payment_status || result.status),
      amount: body.amount,
      paymentMethod: "PIX",
      pix: {
        qrcode: qrcodeData,
        expirationDate: result.pix?.expiration_date || result.expiration_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      customer: result.customer,
      items: (result.items || result.cart || []).map((item: any) => ({
        title: item.title,
        unitPrice: item.price || item.unitPrice || body.amount,
        quantity: item.quantity || 1,
        tangible: true,
        externalRef: item.hash || ""
      })),
      createdAt: result.created_at || result.createdAt,
    }
    
    return NextResponse.json(adaptedResponse)
  } catch (error) {
    console.error("❌ Erro ao criar transação Nitro Pay:", error)
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
