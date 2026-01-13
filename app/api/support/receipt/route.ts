import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Função para verificar status na Ghost
async function checkGhostStatus(paymentId: string): Promise<{ status: string; amount: number } | null> {
  try {
    const secretKey = process.env.GHOSTPAY_API_KEY
    const companyId = process.env.GHOSTPAY_COMPANY_ID
    
    if (!secretKey || !companyId) return null
    
    const credentials = `${secretKey}:${companyId}`
    const base64Credentials = Buffer.from(credentials).toString('base64')
    
    const response = await fetch(
      `https://api.ghostspaysv2.com/functions/v1/transactions/${paymentId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${base64Credentials}`,
          "Content-Type": "application/json",
        },
        cache: 'no-store'
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      return {
        status: data.status || 'unknown',
        amount: data.amount || 0
      }
    }
    
    return null
  } catch (error) {
    console.error('Erro ao consultar Ghost:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const paymentId = formData.get('paymentId') as string
    const file = formData.get('file') as File
    const customerMessage = formData.get('message') as string || ''
    
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Comprovante é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log(`📎 [RECEIPT] Recebendo comprovante para pagamento: ${paymentId}`)
    
    // Verificar status atual na Ghost
    const ghostData = await checkGhostStatus(paymentId)
    const ghostStatus = ghostData?.status || 'unknown'
    const amount = ghostData?.amount || 0
    
    console.log(`📊 [RECEIPT] Status Ghost: ${ghostStatus}, Valor: ${amount}`)
    
    // Upload do arquivo para Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const fileName = `${paymentId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('receipts')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ [RECEIPT] Erro no upload:', uploadError)
      
      // Se o bucket não existir, salvar apenas os dados sem o arquivo
      // O admin pode receber por outro meio
      console.log('⚠️ [RECEIPT] Salvando sem arquivo (bucket pode não existir)')
    }
    
    // Obter URL pública do arquivo
    let receiptUrl = ''
    if (uploadData?.path) {
      const { data: urlData } = supabaseAdmin
        .storage
        .from('receipts')
        .getPublicUrl(uploadData.path)
      
      receiptUrl = urlData?.publicUrl || ''
    }
    
    // Salvar registro na tabela payment_receipts
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('payment_receipts')
      .insert([
        {
          payment_id: paymentId,
          receipt_url: receiptUrl,
          receipt_filename: fileName,
          ghost_status: ghostStatus,
          amount: amount,
          customer_message: customerMessage,
          resolved: false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (insertError) {
      console.error('❌ [RECEIPT] Erro ao salvar no Supabase:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar comprovante. Tente novamente.' },
        { status: 500 }
      )
    }
    
    console.log(`✅ [RECEIPT] Comprovante salvo com sucesso: ${insertedData?.[0]?.id}`)
    
    return NextResponse.json({
      success: true,
      message: 'Comprovante recebido com sucesso',
      data: {
        id: insertedData?.[0]?.id,
        paymentId,
        ghostStatus,
        amount
      }
    })
    
  } catch (error) {
    console.error('❌ [RECEIPT] Erro geral:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
