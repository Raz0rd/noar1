# 📊 API de Logs de Clicks - Documentação Completa

Sistema de logging de acessos com UTMs via Nginx, centralizado no servidor frontend.

---

## 🔑 Autenticação

**Token de Acesso:**
```
gas_clicks_logger_secure_2024_x9k2m
```

**Endpoint Base:**
```
http://149.33.22.82/api-clicks-logs.php
```

---

## 📋 Estrutura do Log

Cada acesso é registrado em formato JSON com os seguintes campos:

```json
{
  "timestamp": "2024-12-29T01:30:00+00:00",
  "ip": "191.7.55.185",
  "method": "GET",
  "uri": "/?utm_source=google&utm_campaign=gas_delivery&gclid=abc123",
  "status": 200,
  "host": "ulltragas.shop",
  "referer": "https://www.google.com/",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "gas_delivery",
  "utm_content": "ad_text",
  "utm_term": "gas butano",
  "gclid": "abc123",
  "fbclid": null,
  "gbraid": null,
  "wbraid": null
}
```

---

## 🎯 Endpoints e Parâmetros

### **GET - Listar Logs**

**URL:**
```
GET /api-clicks-logs.php?token={TOKEN}
```

### **Parâmetros Query:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `token` | string | ✅ Sim | Token de autenticação |
| `domain` | string | ❌ Não | Filtrar por domínio específico |
| `ip` | string | ❌ Não | Filtrar por IP específico |
| `utm_source` | string | ❌ Não | Filtrar por fonte UTM |
| `date` | string | ❌ Não | Filtrar por data (formato: YYYY-MM-DD) |
| `limit` | integer | ❌ Não | Limite de resultados (padrão: 100, máx: 1000) |
| `offset` | integer | ❌ Não | Offset para paginação (padrão: 0) |

---

## 📖 Exemplos de Uso

### **1. Listar todos os logs (últimos 100):**

```bash
curl "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m"
```

**Resposta:**
```json
{
  "success": true,
  "total": 150,
  "limit": 100,
  "offset": 0,
  "count": 100,
  "logs": [
    {
      "timestamp": "2024-12-29T01:30:00+00:00",
      "ip": "191.7.55.185",
      "host": "ulltragas.shop",
      "utm_source": "google",
      "gclid": "abc123"
    }
  ]
}
```

---

### **2. Filtrar por domínio específico:**

```bash
curl "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m&domain=ulltragas.shop"
```

---

### **3. Filtrar por fonte UTM (Google Ads):**

```bash
curl "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m&utm_source=google"
```

---

### **4. Filtrar por data específica:**

```bash
curl "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m&date=2024-12-29"
```

---

### **5. Paginação (próximos 50 resultados):**

```bash
curl "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m&limit=50&offset=50"
```

---

### **6. Filtros combinados:**

```bash
curl "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m&domain=ulltragas.shop&utm_source=google&date=2024-12-29&limit=50"
```

---

## 🐘 Exemplos em PHP

### **Listar logs de um domínio:**

```php
<?php
$token = 'gas_clicks_logger_secure_2024_x9k2m';
$domain = 'ulltragas.shop';

$url = "http://149.33.22.82/api-clicks-logs.php?token={$token}&domain={$domain}";
$response = file_get_contents($url);
$data = json_decode($response, true);

if ($data['success']) {
    echo "Total de logs: " . $data['total'] . "\n";
    
    foreach ($data['logs'] as $log) {
        echo "IP: {$log['ip']} | UTM Source: {$log['utm_source']}\n";
    }
}
?>
```

---

### **Filtrar por data e UTM:**

```php
<?php
$token = 'gas_clicks_logger_secure_2024_x9k2m';
$date = '2024-12-29';
$utmSource = 'google';

$url = "http://149.33.22.82/api-clicks-logs.php?token={$token}&date={$date}&utm_source={$utmSource}";
$response = file_get_contents($url);
$data = json_decode($response, true);

foreach ($data['logs'] as $log) {
    echo "Domínio: {$log['host']} | GCLID: {$log['gclid']}\n";
}
?>
```

---

## 🐍 Exemplos em Python

### **Listar logs:**

```python
import requests

token = 'gas_clicks_logger_secure_2024_x9k2m'
url = f'http://149.33.22.82/api-clicks-logs.php?token={token}'

response = requests.get(url)
data = response.json()

if data['success']:
    print(f"Total de logs: {data['total']}")
    
    for log in data['logs']:
        print(f"IP: {log['ip']} | Domínio: {log['host']} | UTM: {log['utm_source']}")
```

---

### **Filtrar e exportar para CSV:**

```python
import requests
import csv

token = 'gas_clicks_logger_secure_2024_x9k2m'
domain = 'ulltragas.shop'
url = f'http://149.33.22.82/api-clicks-logs.php?token={token}&domain={domain}&limit=1000'

response = requests.get(url)
data = response.json()

if data['success']:
    with open('logs.csv', 'w', newline='') as csvfile:
        fieldnames = ['timestamp', 'ip', 'host', 'utm_source', 'utm_campaign', 'gclid']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for log in data['logs']:
            writer.writerow({
                'timestamp': log['timestamp'],
                'ip': log['ip'],
                'host': log['host'],
                'utm_source': log.get('utm_source', ''),
                'utm_campaign': log.get('utm_campaign', ''),
                'gclid': log.get('gclid', '')
            })
    
    print(f"Exportados {len(data['logs'])} logs para logs.csv")
```

---

## 🟢 Exemplos em Node.js

### **Listar logs:**

```javascript
const axios = require('axios');

const token = 'gas_clicks_logger_secure_2024_x9k2m';
const url = `http://149.33.22.82/api-clicks-logs.php?token=${token}`;

axios.get(url)
  .then(response => {
    const data = response.data;
    
    if (data.success) {
      console.log(`Total de logs: ${data.total}`);
      
      data.logs.forEach(log => {
        console.log(`IP: ${log.ip} | Domínio: ${log.host} | UTM: ${log.utm_source}`);
      });
    }
  })
  .catch(error => {
    console.error('Erro:', error.message);
  });
```

---

### **Filtrar e processar:**

```javascript
const axios = require('axios');

async function getGoogleAdsClicks(domain, date) {
  const token = 'gas_clicks_logger_secure_2024_x9k2m';
  const url = `http://149.33.22.82/api-clicks-logs.php?token=${token}&domain=${domain}&date=${date}&utm_source=google`;
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    
    if (data.success) {
      // Contar clicks únicos por IP
      const uniqueIps = new Set(data.logs.map(log => log.ip));
      
      console.log(`Total de clicks: ${data.total}`);
      console.log(`IPs únicos: ${uniqueIps.size}`);
      
      // Agrupar por campanha
      const campaigns = {};
      data.logs.forEach(log => {
        const campaign = log.utm_campaign || 'sem_campanha';
        campaigns[campaign] = (campaigns[campaign] || 0) + 1;
      });
      
      console.log('Clicks por campanha:', campaigns);
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Usar
getGoogleAdsClicks('ulltragas.shop', '2024-12-29');
```

---

## 📊 Análises Úteis

### **Contar acessos por fonte UTM:**

```bash
curl -s "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m&domain=ulltragas.shop" | \
  jq -r '.logs[].utm_source' | sort | uniq -c | sort -rn
```

### **Ver apenas acessos com GCLID (Google Ads):**

```bash
curl -s "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m" | \
  jq '.logs[] | select(.gclid != null and .gclid != "")'
```

### **Contar IPs únicos por domínio:**

```bash
curl -s "http://149.33.22.82/api-clicks-logs.php?token=gas_clicks_logger_secure_2024_x9k2m&limit=1000" | \
  jq -r '.logs[] | "\(.host) \(.ip)"' | sort -u | cut -d' ' -f1 | uniq -c
```

---

## ⚠️ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `401` | Token de autenticação inválido |
| `404` | Arquivo de log não encontrado |
| `500` | Erro interno ao processar logs |

**Exemplo de erro:**
```json
{
  "success": false,
  "error": "Token de autenticação inválido ou ausente"
}
```

---

## 🔒 Segurança

1. ✅ **Token obrigatório** - Todas as requisições exigem token válido
2. ✅ **CORS habilitado** - Permite acesso de qualquer origem
3. ✅ **Limite de resultados** - Máximo 1000 logs por requisição
4. ✅ **Logs no servidor** - Arquivo protegido em `/var/log/nginx/`

---

## 📁 Localização dos Arquivos

- **Logs:** `/var/log/nginx/clicks.json`
- **API:** `/var/www/html/api-clicks-logs.php`
- **Nginx Config:** `/etc/nginx/nginx.conf` (formato de log)
- **Virtual Hosts:** `/etc/nginx/sites-available/auto/*.conf`

---

## 🎯 Domínios Logados

Todos os domínios configurados no servidor frontend (149.33.22.82) são automaticamente logados:

- ✅ `ulltragas.shop`
- ✅ `sushioriginaljapan.store`
- ✅ `sushigourmetjapones.store`
- ✅ E todos os outros domínios configurados

---

## 🔄 Rotação de Logs

Os logs são automaticamente rotacionados pelo sistema. Para configurar retenção personalizada:

```bash
# Editar configuração de rotação
nano /etc/logrotate.d/nginx

# Adicionar:
/var/log/nginx/clicks.json {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar se o Nginx está rodando: `systemctl status nginx`
2. Verificar logs de erro: `tail -f /var/log/nginx/error.log`
3. Testar configuração: `nginx -t`

---

**Sistema de logging 100% funcional via Nginx! Todos os acessos com UTMs são capturados automaticamente.** 🚀
