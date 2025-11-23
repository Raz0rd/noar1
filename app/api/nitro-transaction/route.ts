import { type NextRequest, NextResponse } from "next/server"

const NITRO_AUTH_TOKEN = 'c2tfbGl2ZV9yRGJEZXhXSzlNNHJOdHNyRGJEZXhXSzlNNHJOdHM=' // Base64 encoded
const NITRO_API_URL = "https://api.nitropagamentos.com/api/public/v1"

// Função para gerar email aleatório
function generateRandomEmail(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  const randomLetters = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const randomNumbers = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${randomLetters}${randomNumbers}@gmail.com`
}

// Função para extrair offer_hash do domínio
function getOfferHash(baseUrl: string): string {
  try {
    const hostname = baseUrl.split('//')[1]?.split(':')[0] || 'localhost'
    return hostname.split('.')[0].toUpperCase()
  } catch {
    return 'PROD'
  }
}

// Função para extrair domain name para postback
function getDomainName(baseUrl: string): string {
  try {
    const hostname = baseUrl.split('//')[1]?.split(':')[0] || 'localhost'
    const domainParts = hostname.replace('www.', '').split('.')
    return domainParts[0]
  } catch {
    return 'localhost'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const baseUrl = request.headers.get('origin') || request.headers.get('referer') || 'http://localhost:3000'
    
    console.log('📤 [Nitro] Criando transação PIX...')
    
    const offerHash = getOfferHash(baseUrl)
    const domainName = getDomainName(baseUrl)
    const customerEmail = body.customer.email || generateRandomEmail()
    
    // Adaptar payload para Nitro
    const nitroPayload = {
      amount: body.amount,
      offer_hash: offerHash,
      payment_method: "pix",
      customer: {
        name: body.customer.name,
        email: customerEmail,
        phone_number: body.customer.phone,
        document: body.customer.document.number || body.customer.document,
        street_name: body.address?.street || "Rua Digital",
        number: body.address?.number || "123",
        complement: body.address?.complement || "",
        neighborhood: body.address?.neighborhood || "Centro",
        city: body.address?.city || "São Paulo",
        state: body.address?.state || "SP",
        zip_code: body.address?.zipCode || "01000000"
      },
      cart: [
        {
          product_hash: offerHash,
          title: body.items[0]?.title || offerHash,
          cover: null,
          price: body.amount,
          quantity: body.items[0]?.quantity || 1,
          operation_type: 1,
          tangible: false
        }
      ],
      installments: 12,
      expire_in_days: 1,
      postback_url: domainName
    }
    
    // Decodificar token Base64
    const apiKey = Buffer.from(NITRO_AUTH_TOKEN, 'base64').toString('utf-8')
    
    const response = await fetch(`${NITRO_API_URL}/transactions?api_token=${apiKey}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(nitroPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Nitro] Erro na API:', response.status, errorText)
      return NextResponse.json(
        { error: `Erro na API Nitro: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Extrair informações da resposta Nitro
    const transactionId = data.hash || data.id
    const pixCode = data.pix?.pix_qr_code
    
    // Gerar QR Code base64
    const QRCode = require('qrcode')
    const qrCodeBase64 = await QRCode.toDataURL(pixCode, { errorCorrectionLevel: 'H' })
    
    console.log('✅ [Nitro] PIX criado com sucesso!')
    console.log(`   - Transaction ID: ${transactionId}`)
    console.log(`   - Valor: R$ ${(body.amount / 100).toFixed(2)}`)
    console.log(`   - Status: ${data.payment_status || 'waiting_payment'}`)
    console.log(`   - Cliente: ${body.customer.name}`)
    
    // Retornar no formato padrão esperado pelo frontend
    return NextResponse.json({
      id: transactionId,
      amount: body.amount,
      status: data.payment_status || 'waiting_payment',
      qrCode: qrCodeBase64,
      qrCodeText: pixCode,
      customer: {
        name: body.customer.name,
        email: customerEmail,
        phone: body.customer.phone,
        document: body.customer.document
      },
      items: body.items,
      createdAt: data.created_at || new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [Nitro] Erro ao processar transação:', error)
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 }
    )
  }
}
