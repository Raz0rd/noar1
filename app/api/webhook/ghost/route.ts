import { type NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

// Função para obter conversion tag baseada no domínio
function getConversionTag(host: string): string {
  const normalizedHost = host.toLowerCase()
  
  if (normalizedHost.includes('entregasexpressnasuaporta.store')) {
    return 'AW-17554338622/ZCa-CN2Y7qobEL7mx7JB'
  }
  
  if (normalizedHost.includes('gasbutano.pro')) {
    return 'AW-17545933033/08VqCI_Qj5obEOnhxq5B'
  }
  
  return 'AW-17545933033/08VqCI_Qj5obEOnhxq5B' // Fallback gasbutano
}

// Função para obter API Key UTMify baseada no domínio
function getUtmifyApiKey(host: string): string {
  // Usar sempre a mesma key para todos os domínios
  return 'YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔔 [Webhook Ghost Pay] Recebido:', {
      type: body.type,
      objectId: body.objectId,
      status: body.data?.status,
      timestamp: new Date().toISOString()
    })
    
    // Verificar se é evento de transação
    if (body.type !== 'transaction') {
      console.log('⚠️ [Webhook] Tipo de evento não é transação, ignorando')
      return NextResponse.json({ 
        success: true,
        message: "Evento recebido mas não processado (não é transação)"
      })
    }
    
    const transactionData = body.data
    const status = transactionData?.status?.toLowerCase()
    
    if (status === 'paid') {
      console.log('✅ [Webhook] Status PAID detectado!')
      
      const transactionId = transactionData.id
      const amount = transactionData.amount // em centavos
      const host = request.headers.get('host') || 'gasbutano.pro'
      
      // 1. Enviar conversão para Google Ads
      try {
        const conversionTag = getConversionTag(host)
        const conversionValueBRL = amount / 100 // Converter centavos para reais
        
        console.log('📢 [Webhook] Enviando Google Ads:', {
          conversionTag,
          value: conversionValueBRL,
          transactionId
        })
        
        // Aqui você pode fazer uma requisição para um endpoint que dispara o gtag
        // Ou salvar em um banco para o frontend consumir
        
      } catch (error) {
        console.error('❌ [Webhook] Erro Google Ads:', error)
      }
      
      // 2. Enviar para UTMify com status PAID
      try {
        const apiKey = getUtmifyApiKey(host)
        
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
        
        // Criar payload UTMify (usar dados salvos se existirem)
        const utmifyPayload = {
          orderId: transactionId.toString(),
          platform: "GasButano",
          paymentMethod: "pix",
          status: "paid",
          createdAt: orderData?.timestamp || transactionData.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
          approvedDate: transactionData.paidAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
          refundedAt: null,
          customer: orderData?.customer || {
            name: transactionData.customer?.name || "Cliente",
            email: transactionData.customer?.email || "cliente@gasbutano.pro",
            phone: transactionData.customer?.phone || "5500000000000",
            document: transactionData.customer?.document || "00000000000",
            country: "BR",
            ip: transactionData.ip || "0.0.0.0"
          },
          products: orderData?.products || transactionData.items?.map((item: any, index: number) => ({
            id: `product-${transactionId}-${index}`,
            name: "OFG2",
            planId: null,
            planName: null,
            quantity: item.quantity || 1,
            priceInCents: item.unitPrice
          })) || [{
            id: `product-${transactionId}-0`,
            name: "OFG2",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: amount
          }],
          trackingParameters: orderData?.trackingParameters || {
            src: null,
            sck: null,
            utm_source: null,
            utm_campaign: null,
            utm_medium: null,
            utm_content: null,
            utm_term: null
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
    } else {
      console.log(`ℹ️ [Webhook] Status recebido: ${status} (não é PAID)`)
    }
    
    // Retornar 200 OK para o Ghost Pay
    return NextResponse.json({ 
      success: true,
      message: "Webhook recebido com sucesso"
    })
    
  } catch (error) {
    console.error('❌ [Webhook Ghost Pay] Erro geral:', error)
    return NextResponse.json({ 
      success: false,
      error: "Erro ao processar webhook"
    }, { status: 500 })
  }
}
