# 🎯 Mapeamento CORRETO - Google Sheets

## ⚠️ PROBLEMA IDENTIFICADO

O Google Apps Script está salvando na ordem dele, MAS o cabeçalho da planilha está em OUTRA ordem!

---

## 📊 Cabeçalho da Planilha (Ordem Real)

```
1.  Projeto
2.  Transaction ID
3.  Email
4.  Telefone
5.  Valor (R$)
6.  GCLID
7.  GBraid
8.  WBraid
9.  IP
10. País
11. Cidade
12. Data Criação
13. Data Pagamento
14. Produto
15. Gateway
16. UTM Source
17. UTM Campaign
18. UTM Medium
19. UTM Content
20. UTM Term
21. FBCLID
22. Keyword
23. Device
24. Network
25. GAD Source
26. GAD Campaign ID
27. Cupons
28. Nome Cliente
29. CPF
```

---

## 🔧 Google Apps Script (Ordem de Salvamento)

```javascript
sheet.appendRow([
  data.createdAt,        // ❌ Salvando em "Projeto" (coluna 1)
  data.paidAt,           // ❌ Salvando em "Transaction ID" (coluna 2)
  data.transactionId,    // ❌ Salvando em "Email" (coluna 3)
  data.email,            // ❌ Salvando em "Telefone" (coluna 4)
  // ... TUDO ERRADO!
]);
```

---

## ✅ SOLUÇÃO

O Google Apps Script precisa criar o cabeçalho NA MESMA ORDEM que salva os dados!

### Opção 1: Corrigir o Google Apps Script (RECOMENDADO)

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById('SEU_ID_DA_PLANILHA');
  
  let sheet = ss.getSheetByName(data.projeto);
  if (!sheet) {
    sheet = ss.insertSheet(data.projeto);
    // Cabeçalho NA MESMA ORDEM dos dados
    sheet.appendRow([
      'Data Criação',      // 1
      'Data Pagamento',    // 2
      'Transaction ID',    // 3
      'Email',             // 4
      'Telefone',          // 5
      'Nome Cliente',      // 6
      'CPF',               // 7
      'Valor (R$)',        // 8
      'Produto',           // 9
      'Gateway',           // 10
      'País',              // 11
      'Cidade',            // 12
      'IP',                // 13
      'GCLID',             // 14
      'GBraid',            // 15
      'WBraid',            // 16
      'UTM Source',        // 17
      'UTM Campaign',      // 18
      'UTM Medium',        // 19
      'UTM Content',       // 20
      'UTM Term',          // 21
      'FBCLID',            // 22
      'Keyword',           // 23
      'Device',            // 24
      'Network',           // 25
      'GAD Source',        // 26
      'GAD Campaign ID',   // 27
      'Cupons'             // 28
    ]);
  }
  
  // Dados na mesma ordem do cabeçalho
  sheet.appendRow([
    data.createdAt || '',
    data.paidAt || '',
    data.transactionId || '',
    data.email || '',
    data.phone || '',
    data.nomeCliente || '',
    data.cpf || '',
    data.valorConvertido || 0,
    data.productName || '',
    data.gateway || '',
    data.pais || '',
    data.cidade || '',
    data.ip || '',
    data.gclid || '',
    data.gbraid || '',
    data.wbraid || '',
    data.utm_source || '',
    data.utm_campaign || '',
    data.utm_medium || '',
    data.utm_content || '',
    data.utm_term || '',
    data.fbclid || '',
    data.keyword || '',
    data.device || '',
    data.network || '',
    data.gad_source || '',
    data.gad_campaignid || '',
    data.cupons || ''
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Cliente salvo com sucesso',
    sheet: data.projeto,
    row: sheet.getLastRow()
  })).setMimeType(ContentService.MimeType.JSON);
}
```

---

## 🎯 Payload que Estamos Enviando (JÁ CORRETO)

```json
{
  "projeto": "localhost",
  "createdAt": "2025-12-05T22:00:00Z",
  "paidAt": "2025-12-05T22:05:00Z",
  "transactionId": "test_123",
  "email": "teste@email.com",
  "phone": "5582999887766",
  "nomeCliente": "João Silva",
  "cpf": "12345678900",
  "valorConvertido": 49.90,
  "productName": "OFG2",
  "gateway": "ghostpay",
  "pais": "BR",
  "cidade": "Maceió",
  "ip": "177.123.45.67",
  "gclid": "Cj0KCQiA...",
  "gbraid": "1BbKGqC...",
  "wbraid": "EjkKCAjw...",
  "utm_source": "google",
  "utm_campaign": "campanha_teste",
  "utm_medium": "cpc",
  "utm_content": "anuncio_teste",
  "utm_term": "gas_butano",
  "fbclid": "IwAR...",
  "keyword": "gas butano",
  "device": "mobile",
  "network": "search",
  "gad_source": "google",
  "gad_campaignid": "Cj0KCQiA...",
  "cupons": ""
}
```

---

## ⚡ AÇÃO IMEDIATA

1. Copie o código corrigido acima
2. Cole no Google Apps Script
3. Salve e faça deploy
4. Teste novamente

Agora os dados vão salvar nas colunas CORRETAS! ✅
