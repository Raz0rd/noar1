# API de Logs de Acesso - Primeiro Acesso com UTMs

API para registrar e consultar logs de primeiro acesso de usuários com parâmetros UTM e tracking.

## 🔑 Autenticação

Token: `gas_domain_manager_2024`

## 📋 Endpoints

### 1. GET - Listar Logs de Acesso

Lista logs de primeiro acesso com filtros opcionais.

**URL:** `GET /api/access-logs?token=gas_domain_manager_2024`

**Parâmetros Query (opcionais):**
- `domain` - Filtrar por domínio específico
- `start_date` - Data inicial (ISO 8601)
- `end_date` - Data final (ISO 8601)
- `limit` - Limite de resultados (padrão: 100)

**Exemplo:**
```bash
curl "http://38.180.196.242:3001/api/access-logs?token=gas_domain_manager_2024&domain=ulltragas.shop&limit=50"
```

**Resposta:**
```json
{
  "success": true,
  "total": 2,
  "logs": [
    {
      "id": "1766970123456_abc123xyz",
      "timestamp": "2024-12-29T01:15:23.456Z",
      "domain": "ulltragas.shop",
      "ip": "191.7.55.185",
      "userAgent": "Mozilla/5.0...",
      "path": "/",
      "utms": {
        "utm_source": "google",
        "utm_medium": "cpc",
        "utm_campaign": "gas_delivery",
        "gclid": "Cj0KCQiA..."
      },
      "referrer": "https://www.google.com/"
    }
  ]
}
```

---

### 2. POST - Registrar Primeiro Acesso

Registra o primeiro acesso de um usuário (IP único por domínio).

**URL:** `POST /api/access-logs`

**Body:**
```json
{
  "domain": "ulltragas.shop",
  "ip": "191.7.55.185",
  "userAgent": "Mozilla/5.0...",
  "path": "/",
  "utms": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "gas_delivery",
    "utm_content": "ad_text",
    "utm_term": "gas butano",
    "gclid": "Cj0KCQiA...",
    "fbclid": "IwAR...",
    "gbraid": "1234567890",
    "wbraid": "0987654321"
  },
  "referrer": "https://www.google.com/"
}
```

**Resposta (Primeiro Acesso):**
```json
{
  "success": true,
  "message": "Primeiro acesso registrado com sucesso",
  "isFirstAccess": true,
  "log": {
    "id": "1766970123456_abc123xyz",
    "timestamp": "2024-12-29T01:15:23.456Z",
    "domain": "ulltragas.shop",
    "ip": "191.7.55.185",
    "userAgent": "Mozilla/5.0...",
    "path": "/",
    "utms": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "gas_delivery",
      "gclid": "Cj0KCQiA..."
    },
    "referrer": "https://www.google.com/"
  }
}
```

**Resposta (Acesso Já Registrado):**
```json
{
  "success": true,
  "message": "Acesso já registrado (não é primeiro acesso)",
  "isFirstAccess": false,
  "existingLog": { ... }
}
```

---

### 3. DELETE - Limpar Logs Antigos

Remove logs mais antigos que X dias.

**URL:** `DELETE /api/access-logs?token=gas_domain_manager_2024`

**Body:**
```json
{
  "days": 30
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "150 logs removidos",
  "remaining": 850
}
```

---

## 🤖 Funcionamento Automático

O middleware captura automaticamente o primeiro acesso quando:

1. ✅ Usuário acessa com UTMs ou parâmetros de tracking
2. ✅ É o primeiro acesso daquele IP naquele domínio
3. ✅ Salva todos os UTMs e informações de tracking

**Parâmetros capturados automaticamente:**
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `gclid` (Google Ads)
- `fbclid` (Facebook Ads)
- `gbraid`, `wbraid` (Google Enhanced Conversions)

---

## 📊 Exemplos de Uso

### Listar todos os acessos de um domínio:
```bash
curl "http://38.180.196.242:3001/api/access-logs?token=gas_domain_manager_2024&domain=ulltragas.shop"
```

### Listar acessos dos últimos 7 dias:
```bash
curl "http://38.180.196.242:3001/api/access-logs?token=gas_domain_manager_2024&start_date=2024-12-22T00:00:00Z"
```

### Limpar logs com mais de 90 dias:
```bash
curl -X DELETE "http://38.180.196.242:3001/api/access-logs?token=gas_domain_manager_2024" \
  -H "Content-Type: application/json" \
  -d '{"days": 90}'
```

---

## 💾 Armazenamento

Logs são salvos em: `/var/www/gasbutano/data/access-logs.json`

Limite: 10.000 logs (os mais antigos são removidos automaticamente)

---

## 🎯 Casos de Uso

1. **Análise de Campanhas:** Ver quais UTMs trazem mais tráfego
2. **Tracking de Conversões:** Correlacionar primeiro acesso com vendas
3. **ROI de Anúncios:** Identificar origem dos clientes
4. **Remarketing:** Criar listas baseadas em primeiro acesso

---

## ⚠️ Importante

- Apenas o **primeiro acesso** de cada IP por domínio é registrado
- Acessos sem UTMs/tracking **não são registrados**
- Logs são salvos de forma **assíncrona** (não bloqueia a requisição)
- Token de autenticação necessário apenas para GET e DELETE
