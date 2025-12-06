# 🐛 Debug - Valor Incorreto no Google Sheets

## ❌ Problema Identificado

O Google Sheets estava recebendo **R$ 0,50** ao invés de **R$ 49,90**.

---

## 🔍 Causa Raiz

O problema estava na conversão do valor de centavos para reais:

### Cenário 1: Valor em Centavos (Correto)
```
amount = 4990 (centavos)
valorConvertido = 4990 / 100 = R$ 49,90 ✅
```

### Cenário 2: Valor Pequeno (Problema)
```
amount = 50 (centavos)
valorConvertido = 50 / 100 = R$ 0,50 ❌
```

O código estava **sempre dividindo por 100**, assumindo que o valor estava em centavos. Mas alguns gateways podem enviar valores pequenos que, quando divididos, ficam incorretos.

---

## ✅ Solução Implementada

### 1. **Priorizar orderData.amount**
```typescript
if (orderData?.amount) {
  // OrderData vem do checkout e é SEMPRE em centavos
  return orderData.amount / 100
}
```

### 2. **Detecção Inteligente para Webhook**
```typescript
else if (amount) {
  // Se >= 100, está em centavos (ex: 4990 = R$ 49,90)
  // Se < 100, pode estar em reais (ex: 49.90)
  return amount >= 100 ? amount / 100 : amount
}
```

### 3. **Logs de Debug**
```typescript
console.log(`💰 [SHEETS] Usando orderData.amount: ${orderData.amount} centavos = R$ ${valor}`)
console.log(`💰 [SHEETS] Usando webhook amount: ${amount} = R$ ${valor}`)
```

---

## 📊 Fluxo de Dados

### Checkout → orders-data.json
```typescript
// No checkout (page.tsx linha 992)
await fetch('/api/save-order-data', {
  body: JSON.stringify({
    amount: pixResponse.amount,  // ← Sempre em centavos
    // ...
  })
})
```

### Webhook → Google Sheets
```typescript
// No webhook (ghost/route.ts linha 201-217)
valorConvertido: (() => {
  if (orderData?.amount) {
    // 1ª prioridade: Usar dados salvos do checkout
    return orderData.amount / 100
  } else if (amount) {
    // 2ª prioridade: Detectar formato do webhook
    return amount >= 100 ? amount / 100 : amount
  }
  return 0
})()
```

---

## 🧪 Como Verificar

### 1. Executar Teste
```
http://localhost:3000/test-webhook.html
```

### 2. Verificar Logs no Terminal
```
💰 [SHEETS] Usando orderData.amount: 4990 centavos = R$ 49.9
📊 [GOOGLE SHEETS] Enviando dados para planilha...
   - Valor Webhook (amount): 4990
   - Valor OrderData: 4990
   - Valor Convertido Final: R$ 49.9
```

### 3. Verificar Google Sheets
- Coluna "valorConvertido" deve mostrar: **49.90**

---

## 📋 Casos de Teste

### Teste 1: Valor Normal (R$ 49,90)
```
orderData.amount = 4990
Resultado: R$ 49,90 ✅
```

### Teste 2: Valor Alto (R$ 199,90)
```
orderData.amount = 19990
Resultado: R$ 199,90 ✅
```

### Teste 3: Valor Baixo (R$ 9,90)
```
orderData.amount = 990
Resultado: R$ 9,90 ✅
```

### Teste 4: Sem orderData (fallback)
```
orderData = null
amount = 4990
Resultado: R$ 49,90 ✅
```

### Teste 5: Valor < 100 (edge case)
```
orderData = null
amount = 50
Resultado: R$ 50,00 (assumido como reais)
```

---

## ⚠️ Observações Importantes

1. **orderData.amount é confiável** - Vem do checkout e é sempre em centavos
2. **Webhook amount pode variar** - Depende do gateway (Ghost Pay, Ezzpag, etc)
3. **Detecção >= 100** - Assume que valores >= 100 estão em centavos
4. **Valores < 100** - Podem ser ambíguos (50 centavos ou R$ 50?)

---

## 🔧 Arquivos Modificados

1. ✅ `app/api/webhook/ghost/route.ts` (linhas 199-217)
   - Lógica de detecção inteligente
   - Logs de debug

2. ✅ `app/checkout/page.tsx` (linha 992)
   - Salva amount em centavos no orderData

---

## 📝 Recomendações

### Para Produção:
1. **Sempre salvar orderData** - Garante valor correto
2. **Monitorar logs** - Verificar qual fonte está sendo usada
3. **Validar planilha** - Conferir se valores estão corretos

### Para Debug:
1. Verificar logs: `💰 [SHEETS]`
2. Comparar `amount` vs `orderData.amount`
3. Conferir se `orders-data.json` foi criado

---

**Status**: ✅ Corrigido  
**Data**: 05/12/2025  
**Versão**: 1.0
