import { type NextRequest, NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

function getUtmifyApiKey(host: string): string {
  return 'YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔔 [Webhook Nitro Pay] Recebido:', {
      type: body.type,
      hash: body.hash,
      status: body.status,
      timestamp: new Date().toISOString()
    })
    
    const status = (body.payment_status || body.status)?.toLowerCase()
    
    if (status === 'paid' || status === 'approved') {
      console.log('✅ [Webhook] Status PAID detectado!')
      
      const transactionId = body.hash || body.id
      const amount = body.amount
      const host = request.headers.get('host') || ''
      
      let orderData = null
      try {
        const filePath = path.join(process.cwd(), 'orders-data.json')
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const ordersData = JSON.parse(fileContent)
        orderData = ordersData[transactionId]
      } catch (error) {
        console.log('⚠️ [Webhook] Pedido não encontrado no arquivo, usando dados do webhook')
      }
      
      console.log('🚀 [GAS API] Iniciando envio para API do Gas...')
      try {
        const { sendToGasAPI, buildGasPayload } = await import('@/lib/gas-api')
        console.log('✅ [GAS API] Módulo gas-api importado com sucesso')
        
        const gasPayload = buildGasPayload(
          transactionId,
          "paid",
          orderData,
          body,
          host,
          body.pix_qrcode || body.qrcode,
          "nitro"
        )
        
        console.log('📦 [GAS API] Payload construído:', JSON.stringify(gasPayload, null, 2))
        await sendToGasAPI(gasPayload)
      } catch (gasError) {
        console.error('❌ [GAS API] Erro ao enviar PAID:', gasError)
        console.error('❌ [GAS API] Stack trace:', gasError instanceof Error ? gasError.stack : 'N/A')
      }
      
      const isTaxPayment = orderData?.isTaxPayment === true || 
                          (body.metadata && 
                           typeof body.metadata === 'object' && 
                           body.metadata.isTaxPayment === true)
      
      if (isTaxPayment) {
        console.log('⚠️ [UTMIFY] PIX de 40% detectado - NÃO enviando para UTMify (frontend já enviou)')
      } else {
        try {
          const apiKey = getUtmifyApiKey(host)
          
          let utmifyTrackingParams = orderData?.trackingParameters || {}
        
        if (Object.keys(utmifyTrackingParams).length === 0 && body.metadata) {
          try {
            const metadata = typeof body.metadata === 'string' 
              ? JSON.parse(body.metadata) 
              : body.metadata
            
            if (metadata.trackingParameters) {
              utmifyTrackingParams = metadata.trackingParameters
              console.log('📊 [UTMIFY] UTMs recuperados do metadata:', utmifyTrackingParams)
            }
          } catch (e) {
            console.error('❌ [UTMIFY] Erro ao parsear metadata:', e)
          }
        }
        
        const normalizedTrackingParams = {
          src: utmifyTrackingParams.src || null,
          sck: utmifyTrackingParams.sck || null,
          utm_source: utmifyTrackingParams.utm_source || null,
          utm_campaign: utmifyTrackingParams.utm_campaign || null,
          utm_medium: utmifyTrackingParams.utm_medium || null,
          utm_content: utmifyTrackingParams.utm_content || null,
          utm_term: utmifyTrackingParams.utm_term || null
        }
        
        const utmifyPayload = {
          orderId: transactionId.toString(),
          platform: "GasButano",
          paymentMethod: "pix",
          status: "paid",
          createdAt: orderData?.timestamp || body.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19),
          approvedDate: body.paid_at || new Date().toISOString().replace('T', ' ').substring(0, 19),
          refundedAt: null,
          customer: orderData?.customer || {
            name: body.customer?.name || "Cliente",
            email: body.customer?.email || "cliente@email.com",
            phone: body.customer?.phone_number || "5500000000000",
            document: body.customer?.document || "00000000000",
            country: "BR",
            ip: body.ip || "0.0.0.0"
          },
          products: orderData?.products || [{
            id: `product-${transactionId}-0`,
            name: "OFG2",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: orderData?.amount || amount
          }],
          trackingParameters: normalizedTrackingParams,
          commission: {
            totalPriceInCents: orderData?.amount || amount,
            gatewayFeeInCents: Math.round((orderData?.amount || amount) * 0.04),
            userCommissionInCents: Math.round((orderData?.amount || amount) * 0.96)
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
      
      try {
        const { saveToGoogleSheets } = await import('@/lib/google-sheets')
        
        const domain = host || ''
        const projectName = domain.replace(/^www\./, '').split('.')[0]
        
        let trackingParameters = orderData?.trackingParameters || {}
        
        if (Object.keys(trackingParameters).length === 0 && body.metadata) {
          try {
            const metadata = typeof body.metadata === 'string' 
              ? JSON.parse(body.metadata) 
              : body.metadata
            
            if (metadata.trackingParameters) {
              trackingParameters = metadata.trackingParameters
              console.log('📊 [SHEETS] UTMs recuperados do metadata:', trackingParameters)
            }
          } catch (e) {
            console.error('❌ [SHEETS] Erro ao parsear metadata:', e)
          }
        }
        
        const valorEmReais = (() => {
          if (orderData?.amount) {
            return parseFloat((orderData.amount / 100).toFixed(2))
          } else if (amount) {
            return parseFloat((amount >= 100 ? amount / 100 : amount).toFixed(2))
          }
          return 0
        })()
        
        console.log(`💰 [SHEETS] Valor calculado: R$ ${valorEmReais}`)
        
        const sheetsPayload = {
          projeto: projectName || '',
          createdAt: orderData?.timestamp || body.created_at || new Date().toISOString(),
          paidAt: body.paid_at || new Date().toISOString(),
          transactionId: transactionId?.toString() || '',
          email: body.customer?.email || orderData?.customer?.email || '',
          phone: body.customer?.phone_number || orderData?.customer?.phone || '',
          nomeCliente: body.customer?.name || orderData?.customer?.name || '',
          cpf: body.customer?.document || orderData?.customer?.document || '',
          valorConvertido: valorEmReais,
          productName: orderData?.products?.[0]?.name || 'OFG2',
          gateway: 'nitropay',
          pais: orderData?.customer?.country || 'BR',
          cidade: body.customer?.city || orderData?.customer?.city || '',
          ip: body.ip || orderData?.customer?.ip || '',
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
    
    return NextResponse.json({ 
      success: true,
      message: "Webhook recebido com sucesso"
    })
    
  } catch (error) {
    console.error('❌ [Webhook Nitro Pay] Erro geral:', error)
    return NextResponse.json({ 
      success: false,
      error: "Erro ao processar webhook"
    }, { status: 500 })
  }
}
