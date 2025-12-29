// Configuração de domínios para multi-tenant
// Cada domínio pode ter suas próprias tags do Google Ads

export type SiteCategory = 'gas' | 'sushi' | 'food' | 'delivery';

export interface DomainConfig {
  GOOGLE_ADS_TAG: string;
  GOOGLE_ADS_CONVERSION: string;
  GOOGLE_ADS_INITIATE_CHECKOUT?: string;
  SITE_URL: string; // URL completa para SEO (Open Graph, Schema.org)
  CATEGORY: SiteCategory; // Categoria do site para renderizar conteúdo específico
  SITE_NAME?: string; // Nome do site (ex: "Configás", "Sushi Express")
  SITE_DESCRIPTION?: string; // Descrição do site
}

export const domainConfigs: Record<string, DomainConfig> = {
  // Domínio padrão (localhost e desenvolvimento)
  'localhost': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY',
    SITE_URL: 'http://localhost:3001',
    CATEGORY: 'gas',
    SITE_NAME: 'Configás',
    SITE_DESCRIPTION: 'Entrega expressa de gás de cozinha em até 30 minutos'
  },
  
  // Exemplo: Configás principal
  'configas.com.br': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY',
    SITE_URL: 'https://configas.com.br',
    CATEGORY: 'gas',
    SITE_NAME: 'Configás',
    SITE_DESCRIPTION: 'Entrega expressa de gás de cozinha em Caucaia'
  },

  // IP do servidor para testes
  '38.180.196.242': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY',
    SITE_URL: 'http://38.180.196.242:3001',
    CATEGORY: 'gas',
    SITE_NAME: 'Configás',
    SITE_DESCRIPTION: 'Entrega expressa de gás de cozinha'
  },

  // IP do servidor com porta
  '38.180.196.242:3001': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY',
    SITE_URL: 'http://38.180.196.242:3001',
    CATEGORY: 'gas',
    SITE_NAME: 'Configás',
    SITE_DESCRIPTION: 'Entrega expressa de gás de cozinha'
  },

  // Ulltra Gás
  'ulltragas.shop': {
    GOOGLE_ADS_TAG: 'AW-12345678',
    GOOGLE_ADS_CONVERSION: 'AW-12345678/conv123',
    SITE_URL: 'https://ulltragas.shop',
    CATEGORY: 'gas',
    SITE_NAME: 'Ulltra Gás',
    SITE_DESCRIPTION: 'Entrega rápida de gás de cozinha'
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

// Função para obter categoria do site
export function getSiteCategory(hostname?: string): SiteCategory {
  return getDomainConfig(hostname).CATEGORY;
}

// Função para obter nome do site
export function getSiteName(hostname?: string): string | undefined {
  return getDomainConfig(hostname).SITE_NAME;
}

// Função para obter descrição do site
export function getSiteDescription(hostname?: string): string | undefined {
  return getDomainConfig(hostname).SITE_DESCRIPTION;
}
