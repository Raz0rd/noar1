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
      
      // Buscar dados do pedido salvo (usado em múltiplos lugares)
      let orderData = null
      try {
        const filePath = path.join(process.cwd(), 'orders-data.json')
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const ordersData = JSON.parse(fileContent)
        orderData = ordersData[transactionId]
      } catch (error) {
        console.log('⚠️ [Webhook] Pedido não encontrado no arquivo, usando dados do webhook')
      }
      
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
            utm_term: null,
            keyword: null,
            device: null,
            network: null,
            gclid: null,
            gbraid: null,
            wbraid: null,
            fbclid: null
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
      
      // 3. Enviar para Google Sheets (usando Google Sheets API)
      try {
        const { saveToGoogleSheets } = await import('@/lib/google-sheets')
        
        // Extrair nome do domínio para usar como projeto
        const domain = host || 'gasbutano.pro'
        const projectName = domain.replace(/^www\./, '').split('.')[0]
        
        const trackingParameters = orderData?.trackingParameters || {}
        
        // Calcular valor em reais (manter como número com 2 casas decimais)
        const valorEmReais = (() => {
          if (orderData?.amount) {
            return parseFloat((orderData.amount / 100).toFixed(2))
          } else if (amount) {
            return parseFloat((amount >= 100 ? amount / 100 : amount).toFixed(2))
          }
          return 0
        })()
        
        console.log(`💰 [SHEETS] Valor calculado: R$ ${valorEmReais}`)
        
        // Google Apps Script espera OBJETO com as propriedades exatas
        const sheetsPayload = {
          projeto: projectName || '',
          createdAt: orderData?.timestamp || transactionData.createdAt || new Date().toISOString(),
          paidAt: transactionData.paidAt || new Date().toISOString(),
          transactionId: transactionId?.toString() || '',
          email: transactionData.customer?.email || orderData?.customer?.email || '',
          phone: transactionData.customer?.phone || orderData?.customer?.phone || '',
          nomeCliente: transactionData.customer?.name || orderData?.customer?.name || '',
          cpf: transactionData.customer?.document || orderData?.customer?.document || '',
          valorConvertido: valorEmReais,
          productName: orderData?.products?.[0]?.name || 'OFG2',
          gateway: 'ghostpay',
          pais: orderData?.customer?.country || 'BR',
          cidade: orderData?.customer?.city || '',
          ip: transactionData.ip || orderData?.customer?.ip || '',
          gclid: trackingParameters.gclid || '',
          gbraid: trackingParameters.gbraid || '',
          wbraid: trackingParameters.wbraid || '',
          utm_source: trackingParameters.utm_source || '',
          utm_campaign: trackingParameters.utm_campaign || '',
          utm_medium: trackingParameters.utm_medium || '',
          utm_content: trackingParameters.utm_content || '',
          utm_term: trackingParameters.utm_term || '',
          fbclid: trackingParameters.fbclid || '',
          keyword: trackingParameters.keyword || '',
          device: trackingParameters.device || '',
          network: trackingParameters.network || '',
          gad_source: trackingParameters.src || '',
          gad_campaignid: trackingParameters.sck || '',
          cupons: ''
        }
        
        console.log(`📊 [GOOGLE SHEETS] Enviando dados para planilha...`)
        console.log(`   - Projeto: ${sheetsPayload.projeto}`)
        console.log(`   - Transaction ID: ${sheetsPayload.transactionId}`)
        console.log(`   - Email: ${sheetsPayload.email}`)
        console.log(`   - Telefone: ${sheetsPayload.phone}`)
        console.log(`   - Valor: R$ ${sheetsPayload.valorConvertido}`)
        console.log(`   - GCLID: ${sheetsPayload.gclid}`)
        console.log(`   - GBRAID: ${sheetsPayload.gbraid}`)
        console.log(`📤 [GOOGLE SHEETS] Payload (objeto):`, JSON.stringify(sheetsPayload, null, 2))
        console.log(`🔍 [GOOGLE SHEETS] Verificação de ordem:`)
        console.log(`   1. projeto: ${sheetsPayload.projeto}`)
        console.log(`   2. transactionId: ${sheetsPayload.transactionId}`)
        console.log(`   3. email: ${sheetsPayload.email}`)
        console.log(`   4. phone: ${sheetsPayload.phone}`)
        console.log(`   5. valorConvertido: ${sheetsPayload.valorConvertido}`)
        
        // Salvar usando Google Sheets API
        const sheetsResult = await saveToGoogleSheets(sheetsPayload)
        
        console.log(`✅ [GOOGLE SHEETS] Cliente salvo na planilha: ${sheetsPayload.email}`)
        console.log(`   - Aba: ${sheetsResult.sheet}`)
        console.log(`   - Linhas adicionadas: ${sheetsResult.rows}`)
      } catch (sheetsError) {
        console.error(`❌ [GOOGLE SHEETS] Erro ao enviar:`, sheetsError)
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
