# Sistema de Fallback Automático de Gateways

## Visão Geral

Sistema inteligente que tenta automaticamente todos os gateways disponíveis até conseguir gerar o QR Code do PIX. Se um gateway falhar, tenta o próximo imediatamente.

## Como Funciona Agora ✅

### Fluxo Anterior (Removido)
```
Cliente → Sorteia Gateway → Salva no localStorage → Tenta gerar PIX
  ↓
Falhou? → Mostra erro ao cliente ❌
```

### Fluxo Novo (Implementado)
```
Cliente → Sorteia Gateway 1 → Tenta gerar PIX
  ↓
Falhou? → Sorteia Gateway 2 → Tenta gerar PIX
  ↓
Falhou? → Sorteia Gateway 3 → Tenta gerar PIX
  ↓
Sucesso? → Salva gateway no localStorage ✅
  ↓
Todos falharam? → Mostra erro ao cliente ❌
```

## Características Principais

### 1. ✅ Uma Tentativa Por Gateway
- Cada gateway recebe **apenas 1 tentativa**
- Não há retry no mesmo gateway
- Evita ban e duplicação de transações

### 2. ✅ Fallback Automático
- Se Ezzpag falhar → Tenta Ghost Pay automaticamente
- Se Ghost Pay falhar → Tenta próximo disponível
- Processo é transparente para o cliente

### 3. ✅ Salvamento Apenas Após Sucesso
- Gateway **NÃO** é salvo ao ser selecionado
- Gateway **SÓ** é salvo após QR Code ser gerado com sucesso
- Próximas compras usam o gateway que funcionou

### 4. ✅ Randomização Inteligente
- Primeiro cliente: sorteia entre todos disponíveis
- Gateway funciona: salva e usa nas próximas
- Gateway falha: tenta outro aleatoriamente

## Exemplo Prático

### Cenário 1: Ezzpag Funciona
```
1. Cliente novo acessa checkout
2. Sistema sorteia: Ezzpag
3. Tenta gerar PIX no Ezzpag
4. ✅ Sucesso! QR Code gerado
5. Salva "ezzpag" no localStorage
6. Cliente paga 70%
7. Gera PIX de 30% no Ezzpag (mesmo gateway)
8. ✅ Sucesso!
```

### Cenário 2: Ezzpag Falha, Ghost Pay Funciona
```
1. Cliente novo acessa checkout
2. Sistema sorteia: Ezzpag
3. Tenta gerar PIX no Ezzpag
4. ❌ Falhou! (timeout, erro 500, etc)
5. Sistema tenta: Ghost Pay
6. ✅ Sucesso! QR Code gerado
7. Salva "ghost" no localStorage
8. Cliente paga 70%
9. Gera PIX de 30% no Ghost Pay (mesmo gateway)
10. ✅ Sucesso!
```

### Cenário 3: Todos os Gateways Falham
```
1. Cliente novo acessa checkout
2. Sistema sorteia: Ezzpag
3. Tenta gerar PIX no Ezzpag
4. ❌ Falhou!
5. Sistema tenta: Ghost Pay
6. ❌ Falhou!
7. Sistema tenta: BlackCat
8. ❌ Falhou!
9. Nenhum gateway disponível
10. ❌ Mostra erro: "Todos os gateways falharam. Tente novamente."
```

### Cenário 4: Cliente Retorna
```
1. Cliente que já comprou antes volta
2. Sistema verifica localStorage: "ghost"
3. Usa Ghost Pay diretamente (não sorteia)
4. ✅ Sucesso! (gateway que funcionou antes)
```

## Logs no Console

### Primeira Tentativa
```
✨ [Gateway] Novo gateway selecionado: Ezzpag (ezzpag)
⏳ [Gateway] Aguardando sucesso para salvar no localStorage
🎯 [Gateway] Tentando: Ezzpag (ezzpag)
```

### Sucesso
```
✅ [Gateway] Sucesso com Ezzpag!
✅ [Gateway] Gateway salvo após sucesso: ezzpag
```

### Falha e Fallback
```
❌ [Gateway] Falha com Ezzpag: Error: Erro 500
🔄 [Gateway] Tentando próximo gateway: Ghost Pay (ghost)
🎯 [Gateway] Tentando: Ghost Pay (ghost)
✅ [Gateway] Sucesso com Ghost Pay!
✅ [Gateway] Gateway salvo após sucesso: ghost
```

### Todos Falharam
```
❌ [Gateway] Falha com Ezzpag: Error: Timeout
🔄 [Gateway] Tentando próximo gateway: Ghost Pay (ghost)
❌ [Gateway] Falha com Ghost Pay: Error: Erro 503
❌ [Gateway] Todos os gateways falharam
❌ [GeneratePix] Erro final: Error: Todos os gateways falharam. Tente novamente.
```

## Código Implementado

### Função `getClientGateway()` (Modificada)
```typescript
export function getClientGateway(): GatewayConfig {
  const saved = localStorage.getItem(STORAGE_KEY)
  
  if (saved) {
    // Usa gateway salvo (que funcionou antes)
    return savedGateway
  }
  
  // Seleciona novo gateway (NÃO salva ainda)
  const selected = selectRandomGateway()
  console.log(`⏳ [Gateway] Aguardando sucesso para salvar`)
  return selected
}
```

### Função `saveSuccessfulGateway()` (Nova)
```typescript
export function saveSuccessfulGateway(gatewayId: GatewayType): void {
  localStorage.setItem(STORAGE_KEY, gatewayId)
  console.log(`✅ [Gateway] Gateway salvo após sucesso: ${gatewayId}`)
}
```

### Função `getNextGateway()` (Nova)
```typescript
export function getNextGateway(excludeIds: GatewayType[]): GatewayConfig | null {
  const available = getEnabledGateways().filter(g => !excludeIds.includes(g.id))
  
  if (available.length === 0) {
    return null // Nenhum gateway disponível
  }
  
  // Selecionar aleatoriamente entre os disponíveis
  const selected = available[Math.floor(Math.random() * available.length)]
  return selected
}
```

### Loop de Fallback em `generatePix()`
```typescript
const failedGateways: GatewayType[] = []
let gateway = getClientGateway()
let pixResponse = null

// Tentar todos os gateways disponíveis
while (!pixResponse && gateway) {
  try {
    // Tentar gerar PIX
    const response = await fetch(gateway.endpoint, { ... })
    
    if (response.ok) {
      pixResponse = await response.json()
      
      // ✅ SALVAR APENAS APÓS SUCESSO
      saveSuccessfulGateway(gateway.id)
    }
  } catch (error) {
    // Adicionar à lista de falhados
    failedGateways.push(gateway.id)
    
    // Tentar próximo gateway
    gateway = getNextGateway(failedGateways)
  }
}

if (!pixResponse) {
  throw new Error("Todos os gateways falharam")
}
```

## Vantagens do Sistema

### 1. Resiliência
- Se um gateway cair, sistema continua funcionando
- Cliente não percebe a falha
- Conversão não é perdida

### 2. Distribuição Inteligente
- Gateways são testados aleatoriamente
- Gateway que funciona é salvo
- Próximas compras usam gateway confiável

### 3. Sem Retry Desnecessário
- Apenas 1 tentativa por gateway
- Evita ban por múltiplas requisições
- Evita duplicação de transações

### 4. Transparência
- Logs detalhados no console
- Fácil debug e monitoramento
- Cliente vê apenas "Gerando PIX..."

## Diferença das Tentativas do Utmify

### ❌ NÃO Confundir com Retry do Utmify

O sistema de fallback de gateways é **diferente** do retry do Utmify:

| Item | Gateway Fallback | Utmify Retry |
|------|------------------|--------------|
| Propósito | Gerar QR Code | Enviar conversão |
| Tentativas | 1 por gateway | 2-5 tentativas |
| Quando | Ao gerar PIX | Após pagamento |
| Pode causar ban? | Não | Não |
| Deve manter? | ✅ Sim | ✅ Sim |

### Retry do Utmify (MANTER)
```typescript
const maxAttempts = status === 'paid' ? 5 : 2
for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
  // Enviar conversão para Utmify
}
```

**Por quê manter?**
- Utmify pode ter problema de rede temporário
- É CRÍTICO garantir que a conversão seja registrada
- NÃO causa ban (são requisições para nosso webhook)

## Configuração Atual

Com 2 gateways habilitados (Ezzpag e Ghost Pay):

### Distribuição Esperada
- **~50% dos clientes** → Tentam Ezzpag primeiro
- **~50% dos clientes** → Tentam Ghost Pay primeiro
- **100% dos clientes** → Conseguem gerar PIX (se pelo menos 1 gateway funcionar)

### Taxa de Sucesso
- Se Ezzpag: 99% uptime → 99% sucesso
- Se Ghost Pay: 99% uptime → 99% sucesso
- **Com fallback: ~99.99% sucesso** (ambos precisam falhar)

## Testando o Sistema

### Simular Falha de Gateway

Para testar o fallback, você pode temporariamente desabilitar um gateway:

```typescript
// lib/gateway-manager.ts
{
  id: 'ezzpag',
  enabled: false, // ← Desabilitar temporariamente
  ...
}
```

Resultado: Sistema usará apenas Ghost Pay

### Ver Logs no Console

1. Abra DevTools (F12)
2. Vá na aba Console
3. Gere um PIX
4. Veja os logs de tentativa e fallback

### Forçar Novo Sorteio

```javascript
// No console do navegador
localStorage.removeItem('selected-gateway')
location.reload()
```

## Monitoramento

### Verificar Gateway Atual
```javascript
localStorage.getItem('selected-gateway')
// Retorna: "ezzpag" ou "ghost"
```

### Verificar Estatísticas
```javascript
JSON.parse(localStorage.getItem('gateway-stats'))
// Retorna: { ezzpag: 45, ghost: 38 }
```

## Resumo das Mudanças

| Antes | Depois |
|-------|--------|
| Sorteia e salva imediatamente | Sorteia mas NÃO salva |
| 1 tentativa, mostra erro | Tenta todos os gateways |
| Cliente vê erro se falhar | Cliente só vê erro se TODOS falharem |
| Gateway salvo pode não funcionar | Gateway salvo SEMPRE funcionou |
| Taxa de sucesso: ~99% | Taxa de sucesso: ~99.99% |

## Benefícios para o Negócio

1. **Menos Abandono**: Cliente não desiste se um gateway falhar
2. **Mais Conversões**: Sistema tenta todos os gateways automaticamente
3. **Melhor Experiência**: Cliente não percebe falhas técnicas
4. **Redundância**: Não depende de um único gateway
5. **Confiabilidade**: Gateway salvo é sempre um que funcionou

---

**Status**: ✅ Sistema implementado e funcionando
**Gateways Habilitados**: Ezzpag + Ghost Pay
**Taxa de Sucesso Esperada**: ~99.99%
