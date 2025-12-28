// Configuração de domínios para multi-tenant
// Cada domínio pode ter suas próprias tags do Google Ads

export interface DomainConfig {
  GOOGLE_ADS_TAG: string;
  GOOGLE_ADS_CONVERSION: string;
  GOOGLE_ADS_INITIATE_CHECKOUT?: string;
  SITE_URL: string; // URL completa para SEO (Open Graph, Schema.org)
}

export const domainConfigs: Record<string, DomainConfig> = {
  // Domínio padrão (localhost e desenvolvimento)
  'localhost': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY',
    SITE_URL: 'http://localhost:3001'
  },
  
  // Exemplo: Configás principal
  'configas.com.br': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY',
    SITE_URL: 'https://configas.com.br'
  },
  
  // Adicione mais domínios aqui conforme necessário
  // 'outrodominio.com.br': {
  //   GOOGLE_ADS_TAG: 'AW-XXXXXXXXXX',
  //   GOOGLE_ADS_CONVERSION: 'AW-XXXXXXXXXX/YYYYYYY',
  //   GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-XXXXXXXXXX/ZZZZZZZ'
  // },
};

// Função para obter configuração do domínio atual
export function getDomainConfig(hostname?: string): DomainConfig {
  // Se não passar hostname, tenta pegar do window (client-side)
  const currentHostname = hostname || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  
  // Remove www. se existir
  const cleanHostname = currentHostname.replace(/^www\./, '');
  
  // Busca configuração do domínio
  const config = domainConfigs[cleanHostname];
  
  // Se não encontrar, usa localhost como fallback
  if (!config) {
    console.warn(`⚠️ Domínio "${cleanHostname}" não configurado. Usando configuração padrão.`);
    return domainConfigs['localhost'];
  }
  
  return config;
}

// Função para obter apenas a tag principal
export function getGoogleAdsTag(hostname?: string): string {
  return getDomainConfig(hostname).GOOGLE_ADS_TAG;
}

// Função para obter tag de conversão
export function getGoogleAdsConversion(hostname?: string): string {
  return getDomainConfig(hostname).GOOGLE_ADS_CONVERSION;
}

// Função para obter tag de initiate checkout
export function getGoogleAdsInitiateCheckout(hostname?: string): string | undefined {
  return getDomainConfig(hostname).GOOGLE_ADS_INITIATE_CHECKOUT;
}
