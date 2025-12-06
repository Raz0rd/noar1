import { NextResponse } from 'next/server'
import { saveToGoogleSheets } from '@/lib/google-sheets'

export async function GET() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('🧪 TESTE DE ENVIO PARA GOOGLE SHEETS')
    console.log('='.repeat(80) + '\n')

    // Dados de teste
    const testData = {
      projeto: 'teste-local',
      transactionId: `test_${Date.now()}`,
      email: 'teste@email.com',
      phone: '11999887766',
      nomeCliente: 'Cliente Teste',
      cpf: '12345678900',
      valorConvertido: 49.90,
      productName: 'Gás 13kg',
      gateway: 'ghostpay',
      pais: 'BR',
      cidade: 'São Paulo',
      ip: '192.168.1.1',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      gclid: 'test_gclid_123',
      gbraid: 'test_gbraid_456',
      wbraid: 'test_wbraid_789',
      utm_source: 'google',
      utm_campaign: 'campanha_teste',
      utm_medium: 'cpc',
      utm_content: 'anuncio_teste',
      utm_term: 'gas butano',
      fbclid: 'test_fbclid_999',
      keyword: 'gas butano',
      device: 'mobile',
      network: 'search',
      gad_source: 'google',
      gad_campaignid: 'campaign_123',
      cupons: ''
    }

    console.log('📦 Dados de teste:')
    console.log(JSON.stringify(testData, null, 2))
    console.log('\n' + '-'.repeat(80) + '\n')

    // Tentar salvar
    console.log('📤 Enviando para Google Sheets...\n')
    const result = await saveToGoogleSheets(testData)

    console.log('\n' + '-'.repeat(80))
    console.log('✅ SUCESSO!')
    console.log('-'.repeat(80))
    console.log(`   - Aba: ${result.sheet}`)
    console.log(`   - Linhas adicionadas: ${result.rows}`)
    console.log('='.repeat(80) + '\n')

    return NextResponse.json({
      success: true,
      message: 'Teste executado com sucesso!',
      result,
      testData
    })

  } catch (error: any) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ ERRO NO TESTE!')
    console.error('='.repeat(80))
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    console.error('='.repeat(80) + '\n')

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
