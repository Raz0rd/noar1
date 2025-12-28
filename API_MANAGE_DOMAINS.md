# 🔧 API - Gerenciamento de Domínios e Tags Google Ads

## 🔍 Visão Geral

API para gerenciar configurações de domínios (tags do Google Ads) e fazer rebuild + restart automático da aplicação.

**Endpoint:** `/api/manage-domains`

---

## 🔐 Autenticação

**Token obrigatório:** `gas_domain_manager_2024`

**Formato:**
```
?token=gas_domain_manager_2024
```

---

## 📋 Rotas Disponíveis

### **1. GET - Listar Domínios**

Lista todas as configurações de domínios cadastradas.

**Endpoint:**
```
GET /api/manage-domains?token=gas_domain_manager_2024
```

**Resposta:**
```json
{
  "success": true,
  "domains": {
    "localhost": {
      "GOOGLE_ADS_TAG": "AW-17780793164",
      "GOOGLE_ADS_CONVERSION": "AW-17780793164/XXXXXXX",
      "GOOGLE_ADS_INITIATE_CHECKOUT": "AW-17780793164/YYYYYYY"
    },
    "configas.com.br": {
      "GOOGLE_ADS_TAG": "AW-17780793164",
      "GOOGLE_ADS_CONVERSION": "AW-17780793164/XXXXXXX"
    }
  },
  "total": 2
}
```

---

### **2. POST - Adicionar/Atualizar Domínio**

Adiciona um novo domínio ou atualiza um existente.

**Endpoint:**
```
POST /api/manage-domains?token=gas_domain_manager_2024
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (campos obrigatórios):**
```json
{
  "domain": "meudominio.com.br",
  "GOOGLE_ADS_TAG": "AW-XXXXXXXXXX",
  "GOOGLE_ADS_CONVERSION": "AW-XXXXXXXXXX/YYYYYYY",
  "SITE_URL": "https://meudominio.com.br"
}
```

**Body (com campos opcionais):**
```json
{
  "domain": "meudominio.com.br",
  "GOOGLE_ADS_TAG": "AW-XXXXXXXXXX",
  "GOOGLE_ADS_CONVERSION": "AW-XXXXXXXXXX/YYYYYYY",
  "GOOGLE_ADS_INITIATE_CHECKOUT": "AW-XXXXXXXXXX/ZZZZZZZ",
  "SITE_URL": "https://meudominio.com.br",
  "CATEGORY": "gas",
  "SITE_NAME": "Meu Gás",
  "SITE_DESCRIPTION": "Entrega rápida de gás"
}
```

**Campos:**
- ✅ **Obrigatórios:** `domain`, `GOOGLE_ADS_TAG`, `GOOGLE_ADS_CONVERSION`, `SITE_URL`
- ⚙️ **Opcionais:** `GOOGLE_ADS_INITIATE_CHECKOUT`, `CATEGORY` (padrão: `'gas'`), `SITE_NAME`, `SITE_DESCRIPTION`

> **Nota:** Como esta API está no projeto do gas (porta específica), o campo `CATEGORY` é automaticamente definido como `'gas'` se não for informado. Todos os domínios liberados por esta rota serão categorizados como gas.

**Resposta - Domínio Criado:**
```json
{
  "success": true,
  "action": "created",
  "domain": "meudominio.com.br",
  "message": "Domínio criado com sucesso",
  "rebuild_required": true
}
```

**Resposta - Domínio Atualizado:**
```json
{
  "success": true,
  "action": "updated",
  "domain": "meudominio.com.br",
  "message": "Domínio atualizado com sucesso",
  "rebuild_required": true
}
```

---

### **3. DELETE - Remover Domínio**

Remove um domínio da configuração.

**Endpoint:**
```
DELETE /api/manage-domains?token=gas_domain_manager_2024
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "domain": "meudominio.com.br"
}
```

**Resposta:**
```json
{
  "success": true,
  "action": "deleted",
  "domain": "meudominio.com.br",
  "message": "Domínio removido com sucesso",
  "rebuild_required": true
}
```

---

### **4. PUT - Rebuild e Restart**

Executa `npm run build` e `pm2 restart gasbutano` automaticamente.

**Endpoint:**
```
PUT /api/manage-domains?token=gas_domain_manager_2024
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "action": "rebuild"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Rebuild e restart executados com sucesso",
  "build_output": "✓ Compiled successfully...",
  "pm2_output": "[PM2] Restarting gasbutano..."
}
```

---

## 📊 Exemplos de Uso

### **1. Listar domínios cadastrados**
```bash
curl "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024"
```

### **2. Adicionar novo domínio**
```bash
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "gasrapido.com.br",
    "GOOGLE_ADS_TAG": "AW-11111111111",
    "GOOGLE_ADS_CONVERSION": "AW-11111111111/conv123",
    "GOOGLE_ADS_INITIATE_CHECKOUT": "AW-11111111111/init456",
    "SITE_URL": "https://gasrapido.com.br"
  }'
```

### **3. Atualizar domínio existente**
```bash
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "gasrapido.com.br",
    "GOOGLE_ADS_TAG": "AW-22222222222",
    "GOOGLE_ADS_CONVERSION": "AW-22222222222/conv789",
    "SITE_URL": "https://gasrapido.com.br"
  }'
```

### **4. Remover domínio**
```bash
curl -X DELETE "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "gasrapido.com.br"
  }'
```

### **5. Fazer rebuild e restart**
```bash
curl -X PUT "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "rebuild"
  }'
```

---

## 🔄 Fluxo Completo de Configuração

### **Adicionar domínio + Rebuild automático:**

```bash
# 1. Adicionar domínio
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "novodominio.com.br",
    "GOOGLE_ADS_TAG": "AW-XXXXXXXXXX",
    "GOOGLE_ADS_CONVERSION": "AW-XXXXXXXXXX/YYYYYYY",
    "SITE_URL": "https://novodominio.com.br"
  }'

# 2. Fazer rebuild e restart
curl -X PUT "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"action": "rebuild"}'
```

---

## ⚡ Rebuild é Necessário?

**Sim!** Sempre que você adicionar, atualizar ou remover um domínio, é necessário fazer rebuild porque:

1. O arquivo `lib/domain-config.ts` é compilado durante o build
2. Next.js precisa recompilar o código TypeScript
3. O PM2 precisa reiniciar para carregar o novo código

### **Quando fazer rebuild:**
- ✅ Após adicionar domínio
- ✅ Após atualizar tags de domínio
- ✅ Após remover domínio

### **Não precisa rebuild:**
- ❌ Apenas consultar domínios (GET)

---

## 🛡️ Segurança

### **Backup Automático:**
Antes de qualquer alteração, a API cria um backup:
```
lib/domain-config.ts.backup.1735427890123
```

### **Permissões Necessárias:**
O processo Node.js precisa ter permissão para:
- ✅ Ler/escrever em `lib/domain-config.ts`
- ✅ Executar `npm run build`
- ✅ Executar `pm2 restart gasbutano`

---

## ⏱️ Tempo de Rebuild

O rebuild pode levar de **30 segundos a 2 minutos**, dependendo do servidor:

1. **Build do Next.js:** ~30-60s
2. **Restart do PM2:** ~5-10s

**Total:** ~35-70 segundos

---

## ❌ Códigos de Erro

### **401 - Token Inválido**
```json
{
  "success": false,
  "error": "Token de autenticação inválido"
}
```

### **400 - Campos Obrigatórios**
```json
{
  "success": false,
  "error": "Campos obrigatórios: domain, GOOGLE_ADS_TAG, GOOGLE_ADS_CONVERSION, SITE_URL"
}
```

### **404 - Domínio Não Encontrado**
```json
{
  "success": false,
  "error": "Domínio não encontrado"
}
```

### **500 - Erro no Rebuild**
```json
{
  "success": false,
  "error": "Build failed: ...",
  "stderr": "npm ERR! ..."
}
```

---

## 🔧 Troubleshooting

### **Rebuild demora muito:**
- Verifique recursos do servidor (CPU, RAM)
- Veja logs: `pm2 logs gasbutano`

### **Erro de permissão:**
```bash
# Dar permissão ao usuário PM2
sudo chown -R $USER:$USER /var/www/gasbutano
```

### **PM2 não reinicia:**
```bash
# Verificar se PM2 está rodando
pm2 list

# Reiniciar manualmente
pm2 restart gasbutano
```

### **Build falha:**
```bash
# Limpar cache e tentar novamente
cd /var/www/gasbutano
rm -rf .next
npm run build
```

---

## 📞 Integração com Admin Domains

Para integrar com o painel admin-domains.html existente:

```javascript
// Adicionar domínio via JavaScript
async function addGasDomain(domain, googleAdsTag, conversion, siteUrl, initCheckout = null) {
  const payload = {
    domain: domain,
    GOOGLE_ADS_TAG: googleAdsTag,
    GOOGLE_ADS_CONVERSION: conversion,
    SITE_URL: siteUrl
  };
  
  if (initCheckout) {
    payload.GOOGLE_ADS_INITIATE_CHECKOUT = initCheckout;
  }
  
  const response = await fetch('http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  if (data.success && data.rebuild_required) {
    // Fazer rebuild automático
    await fetch('http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rebuild' })
    });
  }
  
  return data;
}
```

---

**API completa para gerenciamento de domínios e rebuild automático!** 🚀
