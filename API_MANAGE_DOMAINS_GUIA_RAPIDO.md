# 🚀 API Gerenciamento de Domínios Gas - Guia Rápido

## 🔑 Informações Essenciais

**URL Base:** `http://38.180.196.242:3001/api/manage-domains`  
**Token:** `gas_domain_manager_2024`  
**Categoria:** Automática (`gas` - não precisa enviar)

---

## 📋 Campos Obrigatórios

Ao adicionar/atualizar um domínio, você **DEVE** enviar:

- ✅ `domain` - Nome do domínio (ex: `ulltragas.shop`)
- ✅ `GOOGLE_ADS_TAG` - Tag principal do Google Ads (ex: `AW-12345678`)
- ✅ `GOOGLE_ADS_CONVERSION` - Tag de conversão (ex: `AW-12345678/conv123`)
- ✅ `SITE_URL` - URL completa do site (ex: `https://ulltragas.shop`)

## 🎯 Campos Opcionais

- ⚙️ `GOOGLE_ADS_INITIATE_CHECKOUT` - Tag de início de checkout
- ⚙️ `SITE_NAME` - Nome do site (ex: `Ulltra Gás`)
- ⚙️ `SITE_DESCRIPTION` - Descrição do site
- ⚙️ `CATEGORY` - Categoria (padrão: `gas`)

---

## 🔧 Exemplos Práticos

### **1. Listar Todos os Domínios**

```bash
curl "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024"
```

**Resposta:**
```json
{
  "success": true,
  "domains": {
    "ulltragas.shop": {
      "GOOGLE_ADS_TAG": "AW-12345678",
      "GOOGLE_ADS_CONVERSION": "AW-12345678/conv123",
      "SITE_URL": "https://ulltragas.shop",
      "CATEGORY": "gas"
    }
  },
  "total": 1
}
```

---

### **2. Adicionar Novo Domínio (Mínimo)**

```bash
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"ulltragas.shop","GOOGLE_ADS_TAG":"AW-12345678","GOOGLE_ADS_CONVERSION":"AW-12345678/conv123","SITE_URL":"https://ulltragas.shop"}'
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "action": "created",
  "domain": "ulltragas.shop",
  "message": "Domínio criado com sucesso",
  "rebuild_required": true
}
```

---

### **3. Adicionar Domínio (Completo)**

```bash
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"ulltragas.shop","GOOGLE_ADS_TAG":"AW-12345678","GOOGLE_ADS_CONVERSION":"AW-12345678/conv123","GOOGLE_ADS_INITIATE_CHECKOUT":"AW-12345678/init456","SITE_URL":"https://ulltragas.shop","SITE_NAME":"Ulltra Gás","SITE_DESCRIPTION":"Entrega rápida de gás de cozinha"}'
```

---

### **4. Atualizar Tags de Domínio Existente**

```bash
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"ulltragas.shop","GOOGLE_ADS_TAG":"AW-99999999","GOOGLE_ADS_CONVERSION":"AW-99999999/novaconv","SITE_URL":"https://ulltragas.shop"}'
```

**Resposta:**
```json
{
  "success": true,
  "action": "updated",
  "domain": "ulltragas.shop",
  "message": "Domínio atualizado com sucesso",
  "rebuild_required": true
}
```

---

### **5. Fazer Rebuild (OBRIGATÓRIO após adicionar/atualizar)**

```bash
curl -X PUT "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"action":"rebuild"}'
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

⏱️ **Tempo estimado:** 1-2 minutos

---

### **6. Remover Domínio**

```bash
curl -X DELETE "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"ulltragas.shop"}'
```

---

## 📝 Fluxo Recomendado

### **Cenário 1: Adicionar 1 domínio**
```bash
# 1. Adicionar domínio
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"ulltragas.shop","GOOGLE_ADS_TAG":"AW-12345678","GOOGLE_ADS_CONVERSION":"AW-12345678/conv123","SITE_URL":"https://ulltragas.shop"}'

# 2. Fazer rebuild
curl -X PUT "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"action":"rebuild"}'
```

### **Cenário 2: Adicionar múltiplos domínios**
```bash
# 1. Adicionar domínio 1
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"ulltragas.shop","GOOGLE_ADS_TAG":"AW-11111111","GOOGLE_ADS_CONVERSION":"AW-11111111/conv1","SITE_URL":"https://ulltragas.shop"}'

# 2. Adicionar domínio 2
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"gasrapido.com.br","GOOGLE_ADS_TAG":"AW-22222222","GOOGLE_ADS_CONVERSION":"AW-22222222/conv2","SITE_URL":"https://gasrapido.com.br"}'

# 3. Adicionar domínio 3
curl -X POST "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"domain":"gasexpress.net","GOOGLE_ADS_TAG":"AW-33333333","GOOGLE_ADS_CONVERSION":"AW-33333333/conv3","SITE_URL":"https://gasexpress.net"}'

# 4. Fazer rebuild UMA VEZ (aplica todas as mudanças)
curl -X PUT "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"action":"rebuild"}'
```

---

## ❌ Erros Comuns

### **Erro 401 - Token Inválido**
```json
{
  "success": false,
  "error": "Token de autenticação inválido"
}
```
**Solução:** Verifique se o token está correto: `gas_domain_manager_2024`

### **Erro 400 - Campos Obrigatórios**
```json
{
  "success": false,
  "error": "Campos obrigatórios: domain, GOOGLE_ADS_TAG, GOOGLE_ADS_CONVERSION, SITE_URL"
}
```
**Solução:** Envie todos os campos obrigatórios

### **Erro 404 - Domínio Não Encontrado**
```json
{
  "success": false,
  "error": "Domínio não encontrado"
}
```
**Solução:** O domínio não existe, use POST para criar

---

## 🔍 Testar se Funcionou

Após fazer rebuild, teste se o domínio está ativo:

```bash
# Listar todos os domínios
curl "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024"
```

Procure pelo seu domínio na resposta JSON.

---

## 📞 Exemplo com PowerShell (Windows)

```powershell
# Adicionar domínio
Invoke-WebRequest -Uri "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"domain":"ulltragas.shop","GOOGLE_ADS_TAG":"AW-12345678","GOOGLE_ADS_CONVERSION":"AW-12345678/conv123","SITE_URL":"https://ulltragas.shop"}'

# Fazer rebuild
Invoke-WebRequest -Uri "http://38.180.196.242:3001/api/manage-domains?token=gas_domain_manager_2024" `
  -Method PUT `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"action":"rebuild"}'
```

---

## ✅ Checklist de Uso

- [ ] Tenho o token: `gas_domain_manager_2024`
- [ ] Tenho o domínio configurado (DNS apontando para o servidor)
- [ ] Tenho as tags do Google Ads (TAG e CONVERSION)
- [ ] Enviei POST com todos os campos obrigatórios
- [ ] Recebi `"success": true` na resposta
- [ ] Executei o rebuild (PUT com `action: rebuild`)
- [ ] Aguardei 1-2 minutos para o rebuild terminar
- [ ] Testei listando os domínios (GET)

---

**API 100% funcional e pronta para uso!** 🚀
