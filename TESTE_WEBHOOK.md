# 🧪 Guia de Teste - Webhook Ghost Pay

Este guia explica como testar o fluxo completo de conversão (UTMify + Google Sheets) sem precisar fazer compras reais.

---

## 🚀 Método 1: Interface Web (Mais Fácil)

### Passo 1: Inicie o servidor
```bash
npm run dev
```

### Passo 2: Acesse a página de teste
Abra no navegador:
```
http://localhost:3000/test-webhook.html
```

### Passo 3: Preencha os dados
1. **Email** (obrigatório): Informe um email real para teste
2. **Nome** (opcional): Nome do cliente (padrão: "Cliente Teste")
3. **Valor** (opcional): Valor em R$ (padrão: R$ 49,90)

### Passo 4: Execute o teste
1. Clique no botão **"🚀 Executar Teste Completo"**
2. Aguarde o processamento
3. Veja os resultados na tela

### Passo 5: Verifique os logs
- **No navegador**: Abra DevTools (F12) → Console
- **No terminal**: Veja os logs do servidor Next.js

---

## 🔧 Método 2: API Direta (Avançado)

### Opção A: GET Request (Com Email)
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-webhook?email=seu@email.com&name=João Silva&amount=4990" -Method GET

# Linux/Mac
curl "http://localhost:3000/api/test-webhook?email=seu@email.com&name=João%20Silva&amount=4990"

# Apenas no navegador (mais simples)
http://localhost:3000/api/test-webhook?email=seu@email.com
```

**Parâmetros:**
- `email` (obrigatório): Email do cliente
- `name` (opcional): Nome do cliente (padrão: "Cliente Teste")
- `amount` (opcional): Valor em centavos (padrão: 4990 = R$ 49,90)
```

### Opção B: POST Request (Teste Customizado)
```bash
# Windows PowerShell
$body = @{
    type = "transaction"
    objectId = "custom_test_123"
    data = @{
        id = "custom_test_123"
        status = "PAID"
        amount = 9900
        customer = @{
            name = "Cliente Custom"
            email = "custom@test.com"
        }
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/test-webhook" -Method POST -Body $body -ContentType "application/json"
```

---

## 📊 O Que é Testado?

### ✅ Fluxo Completo:
1. **Webhook Ghost Pay** recebe transação PAID
2. **UTMify** recebe conversão com status PAID
3. **Google Sheets** recebe dados completos

### 🏷️ UTMs Testados:
- ✅ `gclid`: Cj0KCQiA_test_gclid_12345
- ✅ `gbraid`: 1BbKGqC_test_gbraid_67890
- ✅ `wbraid`: EjkKCAjw_test_wbraid_11111
- ✅ `fbclid`: IwAR_test_fbclid_22222
- ✅ `utm_source`: google
- ✅ `utm_campaign`: campanha_teste
- ✅ `utm_medium`: cpc
- ✅ `utm_content`: anuncio_teste
- ✅ `utm_term`: gas_butano_teste

### 📦 Dados Enviados:
```json
{
  "projeto": "localhost",
  "transactionId": "test_1733434567890",
  "email": "teste@gasbutano.pro",
  "phone": "5582999887766",
  "valorConvertido": 49.90,
  "gclid": "Cj0KCQiA_test_gclid_12345",
  "gbraid": "1BbKGqC_test_gbraid_67890",
  "wbraid": "EjkKCAjw_test_wbraid_11111",
  "fbclid": "IwAR_test_fbclid_22222",
  "utm_source": "google",
  "utm_campaign": "campanha_teste",
  "utm_medium": "cpc",
  "nomeCliente": "Cliente Teste"
}
```

---

## 🔍 Verificando os Resultados

### 1. Logs do Terminal
Procure por estas mensagens:
```
✅ [Webhook] Status PAID detectado!
📤 [Webhook] Enviando UTMify PAID
✅ [Webhook] UTMify PAID enviado
📊 [GOOGLE SHEETS] Enviando dados para planilha...
   - Projeto: localhost
   - Email: teste@gasbutano.pro
   - Valor: R$ 49.9
   - GCLID: Cj0KCQiA_test_gclid_12345
   - GBRAID: 1BbKGqC_test_gbraid_67890
✅ [GOOGLE SHEETS] Cliente salvo na planilha
```

### 2. Google Sheets
Verifique se uma nova linha foi adicionada na planilha com:
- Transaction ID começando com `test_`
- Todos os UTMs preenchidos
- Valor: R$ 49,90

### 3. UTMify Dashboard
Acesse o painel do UTMify e verifique se a conversão foi registrada.

---

## 🐛 Troubleshooting

### Erro: "Pedido não encontrado no arquivo"
✅ **Normal!** O teste cria automaticamente o arquivo `orders-data.json` na raiz do projeto.

### Erro: "GOOGLE_SHEETS_WEBHOOK_URL não configurada"
❌ Verifique se a URL está hardcoded no arquivo:
```
app/api/webhook/ghost/route.ts
```

### Erro: "Erro ao enviar para UTMify"
❌ Verifique:
1. API Key do UTMify está correta
2. Conexão com internet está funcionando
3. Logs do terminal para mais detalhes

### Nenhum log aparece
❌ Verifique:
1. Servidor está rodando (`npm run dev`)
2. Porta correta (3000)
3. Console do navegador (F12)

---

## 📝 Arquivo Criado

Após o teste, será criado/atualizado:
```
orders-data.json
```

Este arquivo contém os dados simulados da transação, incluindo todos os UTMs.

---

## 🎯 Próximos Passos

Após confirmar que o teste funciona:

1. ✅ Teste com transação real no ambiente de produção
2. ✅ Verifique se os UTMs reais estão sendo capturados
3. ✅ Confirme que os dados aparecem no Google Sheets
4. ✅ Valide as conversões no UTMify

---

## 💡 Dicas

- Execute o teste várias vezes para simular múltiplas conversões
- Cada execução cria um Transaction ID único
- Os logs são detalhados para facilitar debug
- Use a interface web para testes rápidos
- Use a API direta para automação

---

## 🔗 Links Úteis

- **Página de Teste**: http://localhost:3000/test-webhook.html
- **API Endpoint**: http://localhost:3000/api/test-webhook
- **Webhook Real**: http://localhost:3000/api/webhook/ghost

---

**Criado em**: 05/12/2025  
**Versão**: 1.0
