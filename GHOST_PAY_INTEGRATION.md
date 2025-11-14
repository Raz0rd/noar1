# Integração Ghost Pay

## Visão Geral

Implementação completa da API Ghost Pay para processamento de pagamentos via PIX.

## Arquivos Criados

### 1. **API de Transação**
- **Arquivo**: `app/api/ghost-transaction/route.ts`
- **Método**: POST
- **Descrição**: Cria uma nova transação PIX na Ghost Pay
- **Endpoint**: `/api/ghost-transaction`

### 2. **API de Verificação**
- **Arquivo**: `app/api/check-ghost-payment/route.ts`
- **Método**: GET
- **Descrição**: Consulta o status de uma transação
- **Endpoint**: `/api/check-ghost-payment?id={transactionId}`

### 3. **Webhook**
- **Arquivo**: `app/api/webhook/ghost/route.ts`
- **Método**: POST
- **Descrição**: Recebe notificações de mudança de status
- **Endpoint**: `/api/webhook/ghost`

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Ghost Pay Credentials
GHOST_SECRET_KEY=sua_secret_key_aqui
GHOST_COMPANY_ID=seu_company_id_aqui
```

### Como Obter as Credenciais

1. Acesse o painel do Ghost Pay
2. Navegue até **Integrações → Chaves de API**
3. Copie a **Secret Key** (será usada como username)
4. Copie o **Company ID** (será usado como password)

## Autenticação

A API utiliza **Basic Authentication**:
- **Username**: Secret Key
- **Password**: Company ID

O formato do header é:
```
Authorization: Basic {base64_encoded_credentials}
```

Onde `{base64_encoded_credentials}` é a codificação Base64 de `{SECRET_KEY}:{COMPANY_ID}`.

## Endpoints da Ghost Pay

### Base URL
```
https://api.ghostspaysv2.com/functions/v1
```

### Criar Transação
```
POST /transactions
```

### Consultar Transação
```
GET /transactions/{id}
```

## Formato de Payload

### Request (Criar Transação)

```json
{
  "amount": 10000,
  "description": "Pedido de Gás",
  "paymentMethod": "PIX",
  "installments": 1,
  "postbackUrl": "https://seusite.com/api/webhook/ghost",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999",
    "document": "12345678900"
  },
  "shipping": {
    "street": "Rua Exemplo",
    "streetNumber": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234567"
  },
  "items": [
    {
      "title": "Botijão de Gás 13kg",
      "unitPrice": 10000,
      "quantity": 1,
      "externalRef": "item-123"
    }
  ],
  "metadata": null
}
```

### Response (Transação Criada)

```json
{
  "id": "28a65292-6c74-4368-924d-f52a653706be",
  "status": "waiting_payment",
  "amount": 10000,
  "paymentMethod": "PIX",
  "pix": {
    "qrcode": "00020126580014br.gov.bcb.pix...",
    "expirationDate": "2025-04-03T16:19:43-03:00"
  },
  "customer": { ... },
  "items": [ ... ],
  "createdAt": "2025-04-03T15:59:43-03:00"
}
```

## Status Possíveis

| Status | Descrição | Mapeamento |
|--------|-----------|------------|
| `waiting_payment` | Aguardando pagamento | `waiting_payment` |
| `paid` | Pagamento confirmado | `paid` |
| `refused` | Pagamento recusado | `refused` |
| `canceled` | Transação cancelada | `refused` |
| `refunded` | Pagamento estornado | `refused` |
| `chargedback` | Chargeback | `refused` |
| `failed` | Falha no pagamento | `refused` |
| `expired` | Transação expirada | `refused` |
| `in_analisys` | Em análise | `waiting_payment` |
| `in_protest` | Em protesto | `waiting_payment` |

## Webhook

### Estrutura do Payload

```json
{
  "id": "F92XRTVSGB2B",
  "type": "transaction",
  "objectId": "28a65292-6c74-4368-924d-f52a653706be",
  "data": {
    "id": "28a65292-6c74-4368-924d-f52a653706be",
    "amount": 10000,
    "status": "paid",
    "paymentMethod": "PIX",
    "paidAt": "2025-04-03T15:59:43.56-03:00",
    "customer": { ... },
    "pix": { ... },
    "items": [ ... ]
  }
}
```

### Integração com UTMify

Quando o status é `paid`, o webhook automaticamente:
1. Envia conversão para Google Ads
2. Envia pedido para UTMify com status `paid`
3. Usa o nome de produto **"OFG2"** para pagamentos integrais

## Uso no Frontend

### Criar Transação

```typescript
const response = await fetch('/api/ghost-transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10000, // R$ 100,00 em centavos
    description: "Botijão de Gás 13kg",
    customer: {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      document: { number: customerData.cpf },
      address: {
        street: addressData.street,
        streetNumber: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
      }
    },
    items: [{
      title: "Botijão de Gás 13kg",
      unitPrice: 10000,
      quantity: 1,
      tangible: true,
    }]
  })
})

const pixData = await response.json()
// pixData.pix.qrcode contém o código PIX
```

### Verificar Status

```typescript
const response = await fetch(`/api/check-ghost-payment?id=${transactionId}`)
const status = await response.json()
// status.status pode ser: 'waiting_payment', 'paid', 'refused'
```

## Diferenças das Outras APIs

### Ghost Pay vs Ezzpag
- **Autenticação**: Ghost Pay usa Basic Auth, Ezzpag usa Bearer Token
- **Endpoint**: Ghost Pay tem URL diferente
- **Formato**: Ghost Pay tem estrutura de payload ligeiramente diferente

### Ghost Pay vs BlackCat
- **Webhook**: Ghost Pay envia estrutura com `type` e `data`, BlackCat envia direto
- **Status**: Ghost Pay tem mais variações de status

### Ghost Pay vs Ativo/Umbrela
- **API**: Ghost Pay é independente, Ativo usa gateway Umbrela
- **Response**: Ghost Pay retorna estrutura mais completa

## Notas Importantes

1. **Valores**: Sempre em centavos (R$ 100,00 = 10000)
2. **Telefone**: Remover formatação, apenas números
3. **CPF**: Remover formatação, apenas números
4. **CEP**: Remover formatação, apenas números
5. **Webhook**: Deve retornar status 200 para confirmar recebimento
6. **Timeout**: A API pode levar alguns segundos para responder

## Segurança

- ✅ Credenciais armazenadas em variáveis de ambiente
- ✅ Nunca expor Secret Key no frontend
- ✅ Sempre usar HTTPS em produção
- ✅ Validar dados antes de enviar para a API
- ✅ Logs detalhados para debug

## Suporte

Para mais informações, consulte a documentação oficial:
- **Documentação**: https://ghostspay.readme.io/reference
- **Criar Pagamento**: https://ghostspay.readme.io/reference/post_transactions
- **Webhooks**: https://ghostspay.readme.io/reference/eventos-e-webhooks
