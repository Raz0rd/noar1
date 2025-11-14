# Como Testar a Randomização de Gateways

## Status Atual

✅ **Ghost Pay está HABILITADO**
✅ **Ezzpag está HABILITADO**
✅ **Sistema de randomização está FUNCIONANDO**

## Por Que Não Está Randomizando Para Você?

O sistema está funcionando corretamente! O que acontece é:

1. **Primeira vez**: Sistema sorteia um gateway e salva no `localStorage`
2. **Próximas vezes**: Sistema usa o gateway salvo (para consistência)
3. **Você já tem um gateway salvo**: Por isso sempre usa o mesmo

## Como Testar a Randomização

### Método 1: Console do Navegador (Mais Rápido)

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Digite e execute:
```javascript
localStorage.removeItem('selected-gateway')
```
4. Recarregue a página (F5)
5. Veja no console qual gateway foi selecionado:
   - `✨ [Gateway] Novo gateway selecionado: Ezzpag (ezzpag)` ou
   - `✨ [Gateway] Novo gateway selecionado: Ghost Pay (ghost)`

### Método 2: Modo Anônimo

1. Abra uma janela anônima (Ctrl+Shift+N)
2. Acesse o site
3. Veja qual gateway foi selecionado no console
4. Feche a janela anônima
5. Abra outra janela anônima
6. Acesse novamente
7. Veja se selecionou outro gateway

### Método 3: Limpar Cache

1. DevTools (F12) → Application → Storage
2. Clique em "Clear site data"
3. Recarregue a página

## Como Ver Qual Gateway Está Sendo Usado

### No Console do Navegador

Quando você gera um PIX, verá logs como:

```
🎯 [Gateway] Usando: Ghost Pay (ghost)
```

ou

```
🎯 [Gateway] Usando: Ezzpag (ezzpag)
```

### Verificar Gateway Salvo

No console do navegador:
```javascript
localStorage.getItem('selected-gateway')
```

Retorna: `"ezzpag"` ou `"ghost"`

## Distribuição Esperada

Com 2 gateways habilitados (Ezzpag e Ghost Pay):

- **50% dos clientes** → Ezzpag
- **50% dos clientes** → Ghost Pay

### Como Simular Vários Clientes

Execute no console:
```javascript
// Simular 10 clientes
for (let i = 0; i < 10; i++) {
  localStorage.removeItem('selected-gateway')
  // Recarregar ou chamar getClientGateway()
  console.log(`Cliente ${i+1}: ${localStorage.getItem('selected-gateway')}`)
}
```

## Sobre as Tentativas (Retry)

Você mencionou "3 tentativas". Vamos esclarecer:

### ✅ Tentativas no Utmify (CORRETO - MANTER)

```typescript
const maxAttempts = status === 'paid' ? 5 : 2
for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
  // Enviar para Utmify
}
```

**Por quê?**
- Utmify pode ter problemas de rede temporários
- É CRÍTICO garantir que a conversão seja registrada
- 5 tentativas para pagamentos confirmados
- 2 tentativas para pagamentos pendentes
- **NÃO causa ban** - são requisições para nosso próprio webhook

### ❌ Tentativas no Gateway (NÃO EXISTE)

**NÃO temos** retry automático ao chamar o gateway de pagamento:
- Se Ezzpag falhar → Erro é mostrado ao cliente
- Se Ghost Pay falhar → Erro é mostrado ao cliente
- **Não fazemos múltiplas tentativas** no mesmo gateway

**Por quê?**
- Evita duplicação de transações
- Evita ban por múltiplas requisições
- Cliente pode tentar novamente manualmente

## Comportamento Correto do Sistema

### Cenário 1: Cliente Novo
```
1. Cliente acessa checkout
2. Sistema sorteia: Ghost Pay
3. Salva no localStorage: "ghost"
4. Cliente gera PIX → Usa Ghost Pay
5. Cliente paga 70% → Usa Ghost Pay
6. Cliente paga 30% → Usa Ghost Pay (mesmo gateway)
```

### Cenário 2: Cliente Retorna
```
1. Cliente volta ao site
2. Sistema verifica localStorage: "ghost"
3. Cliente gera novo PIX → Usa Ghost Pay
4. Mantém consistência
```

### Cenário 3: Forçar Novo Gateway
```
1. Cliente teve problema com Ghost Pay
2. Limpar localStorage (ou usar resetGatewaySelection)
3. Sistema sorteia novamente
4. Pode pegar Ezzpag desta vez
```

## Funções Úteis para Debug

### Ver Gateway Atual
```javascript
// No console do navegador
import { getCurrentGatewayInfo } from '@/lib/gateway-manager'
getCurrentGatewayInfo()
// Retorna: { id: 'ghost', name: 'Ghost Pay' }
```

### Forçar Novo Sorteio
```javascript
// No console do navegador
import { resetGatewaySelection } from '@/lib/gateway-manager'
resetGatewaySelection()
// Sorteia e retorna novo gateway
```

### Forçar Gateway Específico
```javascript
// No console do navegador
import { setGateway } from '@/lib/gateway-manager'
setGateway('ghost')  // Força Ghost Pay
setGateway('ezzpag') // Força Ezzpag
```

## Indicador Visual (Debug)

Para ver qual gateway está sendo usado visualmente:

1. Adicione no `app/checkout/page.tsx`:
```tsx
import GatewayIndicator from '@/components/GatewayIndicator'

// Dentro do componente
<GatewayIndicator />
```

2. Acesse com `?debug=1` na URL:
```
http://localhost:3000/checkout?debug=1
```

3. Verá um badge no canto inferior direito mostrando o gateway

## Verificar Logs no Servidor

Se estiver rodando em desenvolvimento:

```bash
# Terminal onde está rodando npm run dev
```

Verá logs como:
```
📤 Criando transação Ghost Pay: {...}
✅ Transação Ghost Pay criada: {...}
```

ou

```
📤 Criando transação Ezzpag: {...}
✅ Transação Ezzpag criada: {...}
```

## Resumo

| Item | Status | Ação |
|------|--------|------|
| Ghost Pay habilitado | ✅ | Nenhuma |
| Ezzpag habilitado | ✅ | Nenhuma |
| Randomização funcionando | ✅ | Nenhuma |
| Retry no Utmify | ✅ | **MANTER** (necessário) |
| Retry no Gateway | ❌ | **NÃO EXISTE** (correto) |
| Você vê sempre o mesmo | ⚠️ | **Normal** (localStorage) |

## Para Testar AGORA

Execute no console do navegador:
```javascript
// 1. Limpar gateway salvo
localStorage.removeItem('selected-gateway')

// 2. Recarregar página
location.reload()

// 3. Verificar qual foi selecionado
// Olhe no console: "✨ [Gateway] Novo gateway selecionado: ..."
```

Faça isso 5-10 vezes e verá que ora seleciona Ezzpag, ora Ghost Pay! 🎲
