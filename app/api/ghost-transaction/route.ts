import { type NextRequest, NextResponse } from "next/server"

const GHOST_AUTH_TOKEN = 'c2tfbGl2ZV9wU3hlaHA5Y2p3MEtMa3d2ZWhwV29XeU5yYklQRVBnNGdOdmJobjl6RFFjZkxUTEY6NzQxYTcyMzEtMjIyMy00NzViLWJiYzItN2VlYzFhOWZmYTFh'
const GHOST_API_URL = "https://api.ghostspaysv2.com/functions/v1"

// Função para gerar credenciais Basic Auth
function getAuthHeader(): string {
  return `Basic ${GHOST_AUTH_TOKEN}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("📤 Criando transação Ghost Pay:", JSON.stringify(body, null, 2))

    // Obter host para construir URL do webhook
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const webhookUrl = `${protocol}://${host}/api/webhook/ghost`

    // Adaptar formato para Ghost Pay API
    const ghostPayload = {
      amount: body.amount, // Valor em centavos
      description: body.description || "Pedido de Gás",
      paymentMethod: "PIX",
      installments: 1,
      postbackUrl: webhookUrl,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone.replace(/\D/g, ''),
        document: body.customer.document.number || body.customer.document,
      },
      shipping: {
        street: body.billing?.street || body.customer.address?.street || body.shipping?.address?.street,
        streetNumber: body.billing?.streetNumber || body.customer.address?.streetNumber || body.shipping?.address?.streetNumber,
        complement: body.billing?.complement || body.customer.address?.complement || body.shipping?.address?.complement || "",
        neighborhood: body.billing?.neighborhood || body.customer.address?.neighborhood || body.shipping?.address?.neighborhood,
        city: body.billing?.city || body.customer.address?.city || body.shipping?.address?.city,
        state: body.billing?.state || body.customer.address?.state || body.shipping?.address?.state,
        zipCode: (body.billing?.zipCode || body.customer.address?.zipCode || body.shipping?.address?.zipCode || "").replace(/\D/g, ''),
      },
      items: body.items.map((item: any) => ({
        title: "GB_2", // Código fixo para Ghost Pay
        unitPrice: item.unitPrice,
        quantity: item.quantity || 1,
        externalRef: `PedG_${Math.floor(1000 + Math.random() * 9000)}`, // PedG_ + 4 dígitos aleatórios
      })),
      // metadata NÃO é enviado para Ghost Pay
    }

    console.log("📦 Ghost Pay Payload:", JSON.stringify(ghostPayload, null, 2))

    const response = await fetch(`${GHOST_API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ghostPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro Ghost Pay Response:", {
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
    console.log("✅ Transação Ghost Pay criada:", result)
    
    // Enviar para API do Gas com status PENDING
    try {
      const { sendToGasAPI, buildGasPayload } = await import('@/lib/gas-api')
      
      const orderData = {
        amount: body.amount,
        customer: body.customer,
        products: body.items,
        trackingParameters: body.metadata?.trackingParameters || {}
      }
      
      const gasPayload = buildGasPayload(
        result.id,
        "pending",
        orderData,
        result,
        host,
        result.pix?.qrcode,
        "ghost"
      )
      
      await sendToGasAPI(gasPayload)
    } catch (gasError) {
      console.error('❌ [GAS API] Erro ao enviar PENDING:', gasError)
    }
    
    // Adaptar resposta para formato compatível com o frontend
    const adaptedResponse = {
      id: result.id,
      status: mapGhostStatus(result.status),
      amount: result.amount,
      paymentMethod: "PIX",
      pix: {
        qrcode: result.pix?.qrcode || "",
        expirationDate: result.pix?.expirationDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      customer: result.customer,
      items: result.items,
      createdAt: result.createdAt,
    }
    
    return NextResponse.json(adaptedResponse)
  } catch (error) {
    console.error("❌ Erro ao criar transação Ghost Pay:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Unknown error"
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
