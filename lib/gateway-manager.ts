/**
 * Gateway Manager
 * 
 * Sistema de gerenciamento de gateways de pagamento com seleção aleatória
 * e persistência no localStorage para garantir que o mesmo cliente use
 * o mesmo gateway durante toda a sessão.
 */

export type GatewayType = 'ezzpag' | 'blackcat' | 'ativo' | 'ghost'

export interface GatewayConfig {
  id: GatewayType
  name: string
  enabled: boolean
  endpoint: string
  checkEndpoint: string
  priority?: number // Opcional: para dar peso na seleção
}

// Mapeamento de nomes para não expor gateways reais
const GATEWAY_NAME_MAP: Record<GatewayType, string> = {
  'ezzpag': 'gateway_a',
  'ghost': 'gateway_b',
  'blackcat': 'gateway_c',
  'ativo': 'gateway_d'
}

// Função para obter nome mapeado
export function getMappedGatewayName(gatewayId: GatewayType): string {
  return GATEWAY_NAME_MAP[gatewayId]
}

// Configuração dos gateways disponíveis
const GATEWAYS: GatewayConfig[] = [
  {
    id: 'ezzpag',
    name: 'Ezzpag',
    enabled: true,
    endpoint: '/api/payment-transaction',
    checkEndpoint: '/api/check-payment-status',
    priority: 1
  },
  {
    id: 'blackcat',
    name: 'BlackCat',
    enabled: false, // Desabilitado por padrão
    endpoint: '/api/blackcat-transaction',
    checkEndpoint: '/api/check-blackcat-payment',
    priority: 1
  },
  {
    id: 'ativo',
    name: 'Ativo/Umbrela',
    enabled: false, // Desabilitado por padrão
    endpoint: '/api/ativo-transaction',
    checkEndpoint: '/api/check-ativo-payment',
    priority: 1
  },
  {
    id: 'ghost',
    name: 'Ghost Pay',
    enabled: true, // Desabilitado por padrão
    endpoint: '/api/ghost-transaction',
    checkEndpoint: '/api/check-ghost-payment',
    priority: 1
  }
]

const STORAGE_KEY = 'selected-gateway'

/**
 * Obtém lista de gateways habilitados
 */
export function getEnabledGateways(): GatewayConfig[] {
  return GATEWAYS.filter(g => g.enabled)
}

/**
 * Seleciona um gateway aleatoriamente entre os habilitados
 * Considera o peso (priority) de cada gateway
 */
export function selectRandomGateway(): GatewayConfig {
  const enabled = getEnabledGateways()
  
  if (enabled.length === 0) {
    throw new Error('Nenhum gateway habilitado')
  }
  
  if (enabled.length === 1) {
    return enabled[0]
  }
  
  // Criar array ponderado baseado na prioridade
  const weighted: GatewayConfig[] = []
  enabled.forEach(gateway => {
    const priority = gateway.priority || 1
    for (let i = 0; i < priority; i++) {
      weighted.push(gateway)
    }
  })
  
  // Selecionar aleatoriamente
  const randomIndex = Math.floor(Math.random() * weighted.length)
  return weighted[randomIndex]
}

/**
 * Obtém o gateway selecionado para o cliente atual
 * Se já existe um gateway salvo no localStorage, retorna ele
 * Caso contrário, seleciona um novo aleatoriamente (MAS NÃO SALVA)
 * O salvamento só acontece após o QR Code ser gerado com sucesso
 */
export function getClientGateway(): GatewayConfig {
  try {
    // Verificar se já existe um gateway salvo (que funcionou antes)
    const saved = localStorage.getItem(STORAGE_KEY)
    
    if (saved) {
      const savedGateway = GATEWAYS.find(g => g.id === saved)
      
      // Verificar se o gateway salvo ainda está habilitado
      if (savedGateway && savedGateway.enabled) {
        const mappedName = getMappedGatewayName(savedGateway.id)
        console.log(`🔄 [Gateway] Usando gateway salvo: ${mappedName}`)
        return savedGateway
      } else {
        console.log(`⚠️ [Gateway] Gateway salvo não está mais habilitado, selecionando novo`)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    
    // Selecionar novo gateway (NÃO salva ainda)
    const selected = selectRandomGateway()
    const mappedName = getMappedGatewayName(selected.id)
    console.log(`✨ [Gateway] Novo gateway selecionado: ${mappedName}`)
    console.log(`⏳ [Gateway] Aguardando sucesso para salvar no localStorage`)
    return selected
    
  } catch (error) {
    console.error('❌ [Gateway] Erro ao obter gateway:', error)
    // Fallback para o primeiro gateway habilitado
    const fallback = getEnabledGateways()[0]
    if (!fallback) {
      throw new Error('Nenhum gateway disponível')
    }
    return fallback
  }
}

/**
 * Obtém informações do gateway atual
 */
export function getCurrentGatewayInfo(): { id: GatewayType; name: string } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const gateway = GATEWAYS.find(g => g.id === saved)
      if (gateway) {
        return { id: gateway.id, name: gateway.name }
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Salva o gateway no localStorage após sucesso na geração do QR Code
 */
export function saveSuccessfulGateway(gatewayId: GatewayType): void {
  try {
    const mappedName = getMappedGatewayName(gatewayId)
    localStorage.setItem(STORAGE_KEY, gatewayId)
    console.log(`✅ [Gateway] Gateway salvo após sucesso: ${mappedName}`)
  } catch (error) {
    console.error('❌ [Gateway] Erro ao salvar gateway:', error)
  }
}

/**
 * Obtém o próximo gateway disponível (fallback)
 * Exclui os gateways que já falharam
 */
export function getNextGateway(excludeIds: GatewayType[]): GatewayConfig | null {
  try {
    const available = getEnabledGateways().filter(g => !excludeIds.includes(g.id))
    
    if (available.length === 0) {
      console.error('❌ [Gateway] Nenhum gateway disponível para fallback')
      return null
    }
    
    // Selecionar aleatoriamente entre os disponíveis
    const selected = available[Math.floor(Math.random() * available.length)]
    console.log(`🔄 [Gateway] Tentando próximo gateway: ${selected.name} (${selected.id})`)
    return selected
    
  } catch (error) {
    console.error('❌ [Gateway] Erro ao obter próximo gateway:', error)
    return null
  }
}

/**
 * Força a seleção de um novo gateway (útil para testes ou retry)
 */
export function resetGatewaySelection(): GatewayConfig {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return getClientGateway()
  } catch (error) {
    console.error('❌ [Gateway] Erro ao resetar gateway:', error)
    throw error
  }
}

/**
 * Define manualmente qual gateway usar (útil para admin/debug)
 */
export function setGateway(gatewayId: GatewayType): boolean {
  try {
    const gateway = GATEWAYS.find(g => g.id === gatewayId)
    
    if (!gateway) {
      console.error(`❌ [Gateway] Gateway não encontrado: ${gatewayId}`)
      return false
    }
    
    if (!gateway.enabled) {
      console.error(`❌ [Gateway] Gateway não está habilitado: ${gatewayId}`)
      return false
    }
    
    localStorage.setItem(STORAGE_KEY, gatewayId)
    console.log(`✅ [Gateway] Gateway definido manualmente: ${gateway.name}`)
    return true
    
  } catch (error) {
    console.error('❌ [Gateway] Erro ao definir gateway:', error)
    return false
  }
}

/**
 * Obtém estatísticas de uso dos gateways (útil para analytics)
 */
export function getGatewayStats(): Record<GatewayType, number> {
  const stats: Record<string, number> = {}
  
  GATEWAYS.forEach(g => {
    stats[g.id] = 0
  })
  
  try {
    const statsStr = localStorage.getItem('gateway-stats')
    if (statsStr) {
      const saved = JSON.parse(statsStr)
      Object.assign(stats, saved)
    }
  } catch {
    // Ignorar erros
  }
  
  return stats as Record<GatewayType, number>
}

/**
 * Incrementa contador de uso do gateway atual
 */
export function trackGatewayUsage(gatewayId: GatewayType): void {
  try {
    const stats = getGatewayStats()
    stats[gatewayId] = (stats[gatewayId] || 0) + 1
    localStorage.setItem('gateway-stats', JSON.stringify(stats))
  } catch {
    // Ignorar erros
  }
}

/**
 * Obtém configuração completa de todos os gateways (útil para admin)
 */
export function getAllGateways(): GatewayConfig[] {
  return [...GATEWAYS]
}

/**
 * Verifica se há múltiplos gateways habilitados
 */
export function hasMultipleGateways(): boolean {
  return getEnabledGateways().length > 1
}
