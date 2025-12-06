import { type NextRequest, NextResponse } from "next/server"

/**
 * Endpoint de TESTE para simular webhook do Ghost Pay
 * Acesse: http://localhost:3000/api/test-webhook?email=seu@email.com
 * 
 * Este endpoint simula uma transação PAID e dispara o webhook interno
 * 
 * Query Parameters:
 * - email (obrigatório): Email real do cliente para teste
 * - name (opcional): Nome do cliente (padrão: "Cliente Teste")
 * - amount (opcional): Valor em centavos (padrão: 4990 = R$ 49,90)
 */
export async function GET(request: NextRequest) {
  try {
    // Obter parâmetros da URL
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const name = searchParams.get('name') || 'Cliente Teste'
    const amount = parseInt(searchParams.get('amount') || '4990')
    
    // Validar email obrigatório
    if (!email) {
      return NextResponse.json({
        success: false,
        error: "Email é obrigatório",
        message: "Use: /api/test-webhook?email=seu@email.com",
        example: "http://localhost:3000/api/test-webhook?email=cliente@teste.com&name=João Silva&amount=4990"
      }, { status: 400 })
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: "Email inválido",
        message: "Por favor, forneça um email válido"
      }, { status: 400 })
    }
    
    console.log('🧪 [TEST WEBHOOK] Iniciando teste de webhook...')
    console.log(`📧 [TEST WEBHOOK] Email: ${email}`)
    console.log(`👤 [TEST WEBHOOK] Nome: ${name}`)
    console.log(`💰 [TEST WEBHOOK] Valor: R$ ${(amount / 100).toFixed(2)}`)
    
    // Payload simulado de uma transação PAID do Ghost Pay
    const mockWebhookPayload = {
      type: "transaction",
      objectId: "test_" + Date.now(),
      data: {
        id: "test_" + Date.now(),
        status: "PAID",
        amount: amount,
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        customer: {
          name: name,
          email: email,
          phone: "5582999887766",
          document: "12345678900"
        },
        ip: "177.123.45.67",
        items: [
          {
            quantity: 1,
            unitPrice: amount
          }
        ]
      }
    }
    
    // Simular dados salvos no orders-data.json (com UTMs)
    const mockOrderData = {
      timestamp: new Date().toISOString(),
      customer: {
        name: name,
        email: email,
        phone: "5582999887766",
        document: "12345678900",
        country: "BR",
        city: "Maceió",
        ip: "177.123.45.67"
      },
      products: [
        {
          id: "product-test-0",
          name: "OFG2",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: amount
        }
      ],
      trackingParameters: {
        src: "google",
        sck: "Cj0KCQiA_test_gclid_12345",
        utm_source: "google",
        utm_campaign: "campanha_teste",
        utm_medium: "cpc",
        utm_content: "anuncio_teste",
        utm_term: "gas_butano_teste",
        keyword: "gas butano",
        device: "mobile",
        network: "search",
        gclid: "Cj0KCQiA_test_gclid_12345",
        gbraid: "1BbKGqC_test_gbraid_67890",
        wbraid: "EjkKCAjw_test_wbraid_11111",
        fbclid: "IwAR_test_fbclid_22222"
      }
    }
    
    console.log('📦 [TEST WEBHOOK] Payload criado:', mockWebhookPayload)
    console.log('🏷️ [TEST WEBHOOK] UTMs simulados:', mockOrderData.trackingParameters)
    
    // Salvar dados simulados temporariamente
    const fs = require('fs')
    const path = require('path')
    const filePath = path.join(process.cwd(), 'orders-data.json')
    
    let ordersData: Record<string, any> = {}
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      ordersData = JSON.parse(fileContent)
    } catch (error) {
      console.log('📝 [TEST WEBHOOK] Criando novo arquivo orders-data.json')
    }
    
    ordersData[mockWebhookPayload.data.id] = mockOrderData
    fs.writeFileSync(filePath, JSON.stringify(ordersData, null, 2))
    console.log('💾 [TEST WEBHOOK] Dados salvos em orders-data.json')
    
    // Chamar o webhook interno
    const webhookUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}/api/webhook/ghost`
    console.log(`🔄 [TEST WEBHOOK] Chamando webhook: ${webhookUrl}`)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockWebhookPayload)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ [TEST WEBHOOK] Webhook processado com sucesso!')
      return NextResponse.json({
        success: true,
        message: "Teste de webhook executado com sucesso!",
        details: {
          transactionId: mockWebhookPayload.data.id,
          email: email,
          name: name,
          amount: mockWebhookPayload.data.amount / 100,
          utms: mockOrderData.trackingParameters,
          webhookResponse: result
        },
        instructions: {
          googleSheets: "Verifique se uma nova linha foi adicionada na planilha",
          utmify: "Verifique o dashboard do UTMify para confirmar a conversão",
          email: "Email usado: " + email
        }
      })
    } else {
      console.error('❌ [TEST WEBHOOK] Erro ao processar webhook')
      return NextResponse.json({
        success: false,
        error: "Erro ao processar webhook",
        details: result
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ [TEST WEBHOOK] Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: "Erro ao executar teste",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Também permitir POST para testes customizados
export async function POST(request: NextRequest) {
  try {
    const customPayload = await request.json()
    
    console.log('🧪 [TEST WEBHOOK] Teste customizado recebido:', customPayload)
    
    // Chamar o webhook interno com payload customizado
    const webhookUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}/api/webhook/ghost`
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customPayload)
    })
    
    const result = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      webhookResponse: result
    })
    
  } catch (error) {
    console.error('❌ [TEST WEBHOOK] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
