import { type NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

// Nota: Conversões do Google Ads são disparadas apenas no frontend via evento 'purchase'
// Não é necessário enviar conversões específicas nos webhooks

// Função para obter API Key UTMify baseada no domínio
function getUtmifyApiKey(host: string): string {
  // Usar sempre a mesma key para todos os domínios
  return 'YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔔 [Webhook Umbrela] Recebido:', {
      status: body.status,
      id: body.id,
      amount: body.amount,
      timestamp: new Date().toISOString()
    })
    
    // Verificar se é PAID
    const status = body.status?.toUpperCase()
    
    if (status === 'PAID') {
      console.log('✅ [Webhook] Status PAID detectado!')
      
      const transactionId = body.id
      const amount = body.amount // em centavos
      const host = request.headers.get('host') || ''
      
      // Nota: Google Ads conversão é disparada automaticamente no frontend via evento 'purchase'
      
      // Buscar dados do pedido salvo
      let orderData = null
      try {
        const filePath = path.join(process.cwd(), 'orders-data.json')
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const ordersData = JSON.parse(fileContent)
        orderData = ordersData[transactionId]
      } catch (error) {
        console.log('⚠️ [Webhook] Pedido não encontrado no arquivo, usando dados do webhook')
      }
      
      // 1. Enviar para API do Gas com status PAID
      try {
        const { sendToGasAPI, buildGasPayload } = await import('@/lib/gas-api')
        
        const gasPayload = buildGasPayload(
          transactionId,
          "paid",
          orderData,
          body,
          host,
          body.pix?.qrcode
        )
        
        await sendToGasAPI(gasPayload)
      } catch (gasError) {
        console.error('❌ [GAS API] Erro ao enviar PAID:', gasError)
      }
      
      // 2. Enviar para UTMify com status PAID
      try {
        const apiKey = getUtmifyApiKey(host)
        
        // Criar payload UTMify (usar dados salvos se existirem)
        const utmifyPayload = {
          orderId: transactionId.toString(),
          platform: "GasButano",
          paymentMethod: "pix",
          status: "paid",
          createdAt: orderData?.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
          approvedDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
          refundedAt: null,
          customer: orderData?.customer || {
            name: body.customer?.name || "Cliente",
            email: body.customer?.email || "cliente@email.com",
            phone: body.customer?.phone || "5500000000000",
            document: "00000000000",
            country: "BR",
            ip: "0.0.0.0"
          },
          products: orderData?.products || [{
            id: `product-${transactionId}-0`,
            name: body.items?.[0]?.title || "Produto",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: amount
          }],
          trackingParameters: {
            src: orderData?.trackingParameters?.src || null,
            sck: orderData?.trackingParameters?.sck || null,
            utm_source: orderData?.trackingParameters?.utm_source || null,
            utm_campaign: orderData?.trackingParameters?.utm_campaign || null,
            utm_medium: orderData?.trackingParameters?.utm_medium || null,
            utm_content: orderData?.trackingParameters?.utm_content || null,
            utm_term: orderData?.trackingParameters?.utm_term || null
          },
          commission: {
            totalPriceInCents: amount,
            gatewayFeeInCents: Math.round(amount * 0.04),
            userCommissionInCents: Math.round(amount * 0.96)
          },
          isTest: false
        }
        
        console.log('📤 [Webhook] Enviando UTMify PAID:', {
          orderId: utmifyPayload.orderId,
          status: utmifyPayload.status
        })
        
        const utmifyResponse = await fetch("https://api.utmify.com.br/api-credentials/orders", {
          method: "POST",
          headers: {
            "x-api-token": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(utmifyPayload),
        })
        
        if (utmifyResponse.ok) {
          const utmifyResult = await utmifyResponse.json()
          console.log('✅ [Webhook] UTMify PAID enviado:', utmifyResult)
        } else {
          const errorText = await utmifyResponse.text()
          console.error('❌ [Webhook] Erro UTMify:', errorText)
        }
        
      } catch (error) {
        console.error('❌ [Webhook] Erro ao enviar UTMify:', error)
      }
    }
    
    // Retornar 200 OK para a Umbrela
    return NextResponse.json({ 
      success: true,
      message: "Webhook recebido com sucesso"
    })
    
  } catch (error) {
    console.error('❌ [Webhook] Erro geral:', error)
    return NextResponse.json({ 
      success: false,
      error: "Erro ao processar webhook"
    }, { status: 500 })
  }
}
