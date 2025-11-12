import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json()
    
    // Validar CPF
    const cleanCpf = cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido' },
        { status: 400 }
      )
    }
    
    // Fazer requisição para API externa (servidor-side)
    const apiUrl = `http://74.50.76.90:7000/f9361c92e28d38772782e826d2442d07c5fdd833d9b3efe4beadffae322292da/cpf/${cleanCpf}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao verificar CPF' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    // Retornar apenas os dados necessários
    return NextResponse.json({
      found: !!data?.nomeCompleto,
      nomeCompleto: data?.nomeCompleto || null
    })
    
  } catch (error) {
    console.error('Erro ao verificar CPF:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar CPF' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
