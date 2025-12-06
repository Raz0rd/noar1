# 📊 Estrutura de Dados - Google Sheets

Este documento descreve a estrutura completa dos dados enviados para o Google Sheets.

---

## 📦 Payload Completo

```json
{
  // ==========================================
  // IDENTIFICAÇÃO
  // ==========================================
  "projeto": "gasbutano",           // Nome do projeto/domínio
  "transactionId": "123456789",     // ID único da transação
  
  // ==========================================
  // DADOS DO CLIENTE
  // ==========================================
  "nomeCliente": "João Silva",      // Nome completo
  "email": "joao@email.com",        // Email (OBRIGATÓRIO)
  "phone": "5582999887766",         // Telefone com DDD
  "cpf": "12345678900",             // CPF sem formatação
  
  // ==========================================
  // LOCALIZAÇÃO
  // ==========================================
  "ip": "177.123.45.67",            // IP do cliente
  "pais": "BR",                     // Código do país
  "cidade": "Maceió",               // Cidade
  "estado": "AL",                   // Estado (UF)
  
  // ==========================================
  // TRANSAÇÃO
  // ==========================================
  "valorConvertido": 49.90,         // Valor em reais (R$)
  "gateway": "ghostpay",            // Gateway de pagamento
  "productName": "OFG2",            // Nome do produto
  
  // ==========================================
  // DATAS
  // ==========================================
  "createdAt": "2025-12-05T18:30:00.000Z",  // Data de criação
  "paidAt": "2025-12-05T18:35:00.000Z",     // Data de pagamento
  
  // ==========================================
  // GOOGLE ADS
  // ==========================================
  "gclid": "Cj0KCQiA...",           // Google Click ID
  "gbraid": "1BbKGqC...",           // Google Brand ID (iOS)
  "wbraid": "EjkKCAjw...",          // Web Brand ID
  
  // ==========================================
  // FACEBOOK ADS
  // ==========================================
  "fbclid": "IwAR...",              // Facebook Click ID
  
  // ==========================================
  // UTMs PADRÃO
  // ==========================================
  "utm_source": "google",           // Origem do tráfego
  "utm_campaign": "campanha_ff",    // Nome da campanha
  "utm_medium": "cpc",              // Meio (cpc, organic, etc)
  "utm_content": "anuncio_1",       // Conteúdo do anúncio
  "utm_term": "gas_butano",         // Termo de busca
  
  // ==========================================
  // UTMs ADICIONAIS (UTMIFY)
  // ==========================================
  "src": "google",                  // Source alternativo
  "sck": "Cj0KCQiA...",            // Sub-cookie (pode ser gclid)
  "keyword": "gas butano",          // Palavra-chave
  "device": "mobile",               // Dispositivo (mobile/desktop)
  "network": "search"               // Rede (search/display)
}
```

---

## 🔄 Regras de Preenchimento

### Campos Obrigatórios
- ✅ `projeto` - Sempre preenchido (extraído do domínio)
- ✅ `transactionId` - Sempre preenchido (ID da transação)
- ✅ `email` - **OBRIGATÓRIO** - Vem do formulário do checkout
- ✅ `valorConvertido` - Sempre preenchido (valor da transação)
- ✅ `createdAt` - Sempre preenchido (timestamp)
- ✅ `paidAt` - Sempre preenchido (timestamp)

### Campos Opcionais
- ⚪ Todos os outros campos são opcionais
- ⚪ Se não houver valor, envia **string vazia** (`""`)
- ⚪ **NUNCA** envia `null` ou `undefined`

---

## 📋 Exemplos

### Exemplo 1: Conversão Completa (com todos os dados)
```json
{
  "projeto": "gasbutano",
  "transactionId": "1733434567890",
  "nomeCliente": "Maria Santos",
  "email": "maria@gmail.com",
  "phone": "5511987654321",
  "cpf": "98765432100",
  "ip": "177.123.45.67",
  "pais": "BR",
  "cidade": "São Paulo",
  "estado": "SP",
  "valorConvertido": 89.90,
  "gateway": "ghostpay",
  "productName": "OFG2",
  "createdAt": "2025-12-05T18:30:00.000Z",
  "paidAt": "2025-12-05T18:35:00.000Z",
  "gclid": "Cj0KCQiA1234567890",
  "gbraid": "1BbKGqC9876543210",
  "wbraid": "",
  "fbclid": "",
  "utm_source": "google",
  "utm_campaign": "vendas_dezembro",
  "utm_medium": "cpc",
  "utm_content": "anuncio_promo",
  "utm_term": "gas_delivery",
  "src": "google",
  "sck": "Cj0KCQiA1234567890",
  "keyword": "gas delivery",
  "device": "mobile",
  "network": "search"
}
```

### Exemplo 2: Conversão Mínima (sem UTMs)
```json
{
  "projeto": "gasbutano",
  "transactionId": "1733434567891",
  "nomeCliente": "João Silva",
  "email": "joao@email.com",
  "phone": "5582999887766",
  "cpf": "12345678900",
  "ip": "177.123.45.68",
  "pais": "BR",
  "cidade": "Maceió",
  "estado": "",
  "valorConvertido": 49.90,
  "gateway": "ghostpay",
  "productName": "OFG2",
  "createdAt": "2025-12-05T18:40:00.000Z",
  "paidAt": "2025-12-05T18:45:00.000Z",
  "gclid": "",
  "gbraid": "",
  "wbraid": "",
  "fbclid": "",
  "utm_source": "",
  "utm_campaign": "",
  "utm_medium": "",
  "utm_content": "",
  "utm_term": "",
  "src": "",
  "sck": "",
  "keyword": "",
  "device": "",
  "network": ""
}
```

---

## 🎯 Campos Mais Importantes

### Para Atribuição de Conversão:
1. **`gclid`** - Google Ads (prioridade máxima)
2. **`gbraid`** - Google Ads iOS 14.5+
3. **`wbraid`** - Google Ads Web
4. **`fbclid`** - Facebook Ads
5. **`utm_source`** - Origem do tráfego
6. **`utm_campaign`** - Campanha específica

### Para Análise de Performance:
1. **`email`** - Identificação do cliente
2. **`valorConvertido`** - Valor da venda
3. **`device`** - Dispositivo usado
4. **`network`** - Rede de anúncios
5. **`keyword`** - Palavra-chave que converteu

---

## 🔍 Validações

### No Backend (Webhook):
```typescript
// Todos os campos sempre têm valor (string vazia se não houver dados)
const sheetsPayload = {
  projeto: projectName || '',
  email: customerEmail || '',
  gclid: trackingParams.gclid || '',
  // ... etc
}
```

### Garantias:
- ✅ Nenhum campo é `null`
- ✅ Nenhum campo é `undefined`
- ✅ Campos numéricos são `0` se vazios
- ✅ Campos de texto são `''` se vazios
- ✅ Campos de data sempre têm timestamp válido

---

## 📝 Notas Importantes

1. **Email é obrigatório** - Vem do formulário do checkout
2. **GCLID/GBRAID** - Capturados automaticamente da URL
3. **UTMs** - Capturados da URL e salvos no localStorage
4. **Valores vazios** - Sempre enviar string vazia, nunca null
5. **Formato de data** - ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
6. **Telefone** - Apenas números, com DDD do país (55)
7. **CPF** - Apenas números, sem formatação

---

## 🔗 Endpoints que Enviam para Sheets

1. **Webhook Ghost Pay**: `/api/webhook/ghost`
   - Dispara quando pagamento é confirmado (PAID)
   - Usa dados salvos em `orders-data.json`

2. **Teste**: `/api/test-webhook`
   - Para testes sem compra real
   - Simula dados completos

---

**Última atualização**: 05/12/2025  
**Versão**: 2.0
