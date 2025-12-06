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
    
    // Deletar todos os registros do Supabase (tabela card_attempts)
    const { error } = await supabaseAdmin
      .from('card_attempts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deleta todos os registros
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: "Erro ao apagar dados",
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Todos os dados foram apagados"
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: "Erro ao processar requisição",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
