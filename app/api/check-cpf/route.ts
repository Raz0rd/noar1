import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📋 [CHECK-CPF] Recebendo requisição...')
    
    const body = await request.json()
    const { cpf } = body
    
    console.log('📋 [CHECK-CPF] CPF recebido:', cpf)
    
    // Validar CPF
    const cleanCpf = cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      console.log('❌ [CHECK-CPF] CPF inválido:', cleanCpf)
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }
    
    // Fazer requisição para API externa (servidor-side)
    const apiUrl = `http://74.50.76.90:7000/f9361c92e28d38772782e826d2442d07c5fdd833d9b3efe4beadffae322292da/cpf/${cleanCpf}`
    console.log('🔍 [CHECK-CPF] Consultando API externa...')
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('📡 [CHECK-CPF] Status da resposta:', response.status)
    
    if (!response.ok) {
      console.log('❌ [CHECK-CPF] Erro na API externa:', response.status)
      return NextResponse.json(
        { error: 'Erro ao verificar CPF', found: false },
        { status: 200 }
      )
    }
    
    const data = await response.json()
    console.log('✅ [CHECK-CPF] Dados recebidos:', data)
    
    // Retornar apenas os dados necessários
    const result = {
      found: !!data?.nomeCompleto,
      nomeCompleto: data?.nomeCompleto || null
    }
    
    console.log('📤 [CHECK-CPF] Retornando:', result)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ [CHECK-CPF] Erro ao verificar CPF:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar CPF', found: false },
      { status: 200 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
