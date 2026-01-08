import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getDomainConfig } from '@/lib/domain-config'

// GET - Retornar apenas as configurações públicas do tenant atual
export async function GET(request: NextRequest) {
  try {
    // Obter hostname do request
    const headersList = headers()
    let hostname = headersList.get('x-hostname') || headersList.get('host') || 'localhost'
    
    // Remover porta se existir (ex: deliverygazz.store:443 -> deliverygazz.store)
    hostname = hostname.split(':')[0]
    
    console.log('[TENANT-CONFIG] Hostname detectado:', hostname)
    
    // Obter configuração do domínio atual
    const domainConfig = getDomainConfig(hostname)
    
    console.log('[TENANT-CONFIG] Configuração carregada:', {
      domain: hostname,
      tag: domainConfig.GOOGLE_ADS_TAG
    })
    
    // Retornar apenas as informações necessárias para o Google Ads
    // NÃO expor informações de outros domínios
    return NextResponse.json({
      success: true,
      config: {
        GOOGLE_ADS_TAG: domainConfig.GOOGLE_ADS_TAG,
        GOOGLE_ADS_CONVERSION: domainConfig.GOOGLE_ADS_CONVERSION,
        GOOGLE_ADS_INITIATE_CHECKOUT: domainConfig.GOOGLE_ADS_INITIATE_CHECKOUT,
      }
    })
    
  } catch (error: any) {
    console.error('[TENANT-CONFIG] Erro ao obter configuração:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao obter configuração do tenant' },
      { status: 500 }
    )
  }
}
