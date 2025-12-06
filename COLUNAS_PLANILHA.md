# 📊 Mapeamento de Colunas - Google Sheets

## ⚠️ IMPORTANTE: Preencha os nomes EXATOS das colunas da sua planilha

Copie os nomes das colunas EXATAMENTE como aparecem na primeira linha da planilha do Google Sheets.

---

## 📝 Template de Colunas

Substitua `???` pelos nomes EXATOS das colunas:

```
COLUNA A: ???  (ex: "Projeto" ou "projeto" ou "PROJETO")
COLUNA B: ???  (ex: "Transaction ID" ou "transactionId" ou "id_transacao")
COLUNA C: ???  (ex: "Nome" ou "nomeCliente" ou "cliente_nome")
COLUNA D: ???  (ex: "Email" ou "email" ou "e-mail")
COLUNA E: ???  (ex: "Telefone" ou "phone" ou "telefone")
COLUNA F: ???  (ex: "CPF" ou "cpf" ou "documento")
COLUNA G: ???  (ex: "IP" ou "ip")
COLUNA H: ???  (ex: "País" ou "pais" ou "country")
COLUNA I: ???  (ex: "Cidade" ou "cidade" ou "city")
COLUNA J: ???  (ex: "Estado" ou "estado" ou "uf")
COLUNA K: ???  (ex: "Valor" ou "valorConvertido" ou "valor_convertido")
COLUNA L: ???  (ex: "Gateway" ou "gateway" ou "forma_pagamento")
COLUNA M: ???  (ex: "Produto" ou "productName" ou "produto")
COLUNA N: ???  (ex: "Data Criação" ou "createdAt" ou "data_criacao")
COLUNA O: ???  (ex: "Data Pagamento" ou "paidAt" ou "data_pagamento")
COLUNA P: ???  (ex: "GCLID" ou "gclid")
COLUNA Q: ???  (ex: "GBRAID" ou "gbraid")
COLUNA R: ???  (ex: "WBRAID" ou "wbraid")
COLUNA S: ???  (ex: "FBCLID" ou "fbclid")
COLUNA T: ???  (ex: "UTM Source" ou "utm_source")
COLUNA U: ???  (ex: "UTM Campaign" ou "utm_campaign")
COLUNA V: ???  (ex: "UTM Medium" ou "utm_medium")
COLUNA W: ???  (ex: "UTM Content" ou "utm_content")
COLUNA X: ???  (ex: "UTM Term" ou "utm_term")
COLUNA Y: ???  (ex: "SRC" ou "src")
COLUNA Z: ???  (ex: "SCK" ou "sck")
COLUNA AA: ??? (ex: "Keyword" ou "keyword")
COLUNA AB: ??? (ex: "Device" ou "device")
COLUNA AC: ??? (ex: "Network" ou "network")
```

---

## 🎯 Payload Atual que Estamos Enviando

```json
{
  "projeto": "gasbutano",
  "transactionId": "123456789",
  "nomeCliente": "João Silva",
  "email": "joao@email.com",
  "phone": "5582999887766",
  "cpf": "12345678900",
  "ip": "177.123.45.67",
  "pais": "BR",
  "cidade": "Maceió",
  "estado": "AL",
  "valorConvertido": 49.90,
  "gateway": "ghostpay",
  "productName": "OFG2",
  "createdAt": "2025-12-05T18:30:00.000Z",
  "paidAt": "2025-12-05T18:35:00.000Z",
  "gclid": "Cj0KCQiA...",
  "gbraid": "1BbKGqC...",
  "wbraid": "EjkKCAjw...",
  "fbclid": "IwAR...",
  "utm_source": "google",
  "utm_campaign": "campanha_teste",
  "utm_medium": "cpc",
  "utm_content": "anuncio_teste",
  "utm_term": "gas_butano_teste",
  "src": "google",
  "sck": "Cj0KCQiA...",
  "keyword": "gas butano",
  "device": "mobile",
  "network": "search"
}
```

---

## 📋 Instruções

1. Abra a planilha do Google Sheets
2. Veja a primeira linha (cabeçalho)
3. Copie os nomes EXATOS das colunas
4. Cole aqui substituindo os `???`
5. Me informe os nomes corretos

---

## 🔧 Exemplo de Resposta

```
COLUNA A: Projeto
COLUNA B: ID da Transação
COLUNA C: Nome do Cliente
COLUNA D: E-mail
COLUNA E: Telefone
COLUNA F: CPF
...
```

---

## ⚠️ Observações Importantes

- **Case Sensitive**: "Email" ≠ "email" ≠ "EMAIL"
- **Espaços**: "utm_source" ≠ "utm source"
- **Acentos**: "País" ≠ "Pais"
- **Underscores**: "utm_source" ≠ "utmsource"

---

**Aguardando os nomes corretos das colunas...**
