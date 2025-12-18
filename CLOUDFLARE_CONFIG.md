# ☁️ Configuração do Cloudflare para Deploy

## 🎯 Configurações Necessárias

### 1️⃣ **Registro DNS (Tipo A)**

No painel do Cloudflare, vá em **DNS** → **Records** e configure:

```
Tipo: A
Nome: @ (ou seu subdomínio)
Conteúdo: IP_DO_SEU_SERVIDOR_UBUNTU
TTL: Auto
```

**Exemplo:**
```
Tipo: A
Nome: @
Conteúdo: 123.45.67.89
TTL: Auto
Proxy status: Proxied (nuvem laranja) ✅
```

**Para subdomínio (ex: app.seudominio.com):**
```
Tipo: A
Nome: app
Conteúdo: 123.45.67.89
TTL: Auto
Proxy status: Proxied (nuvem laranja) ✅
```

---

### 2️⃣ **Proxy Status (Nuvem Laranja)**

**✅ RECOMENDADO: Proxied (Nuvem Laranja Ativa)**

**Vantagens:**
- ✅ Proteção DDoS automática
- ✅ CDN global (site mais rápido)
- ✅ SSL/TLS gerenciado pelo Cloudflare
- ✅ Oculta o IP real do servidor
- ✅ Cache automático de assets estáticos
- ✅ Firewall WAF (Web Application Firewall)

**Quando usar:**
- Sites de produção
- E-commerce
- Aplicações públicas
- Quando precisa de proteção extra

---

**❌ DNS Only (Nuvem Cinza)**

**Quando usar:**
- Desenvolvimento/testes
- Quando precisa do IP real exposto
- Quando tem problemas de compatibilidade com proxy

---

### 3️⃣ **Configuração SSL/TLS**

No painel do Cloudflare, vá em **SSL/TLS** → **Overview**

**✅ CONFIGURAÇÃO RECOMENDADA: Full (strict)**

```
Encryption mode: Full (strict)
```

**Por quê?**
- ✅ Criptografia end-to-end (Cloudflare ↔ Servidor)
- ✅ Valida o certificado SSL do servidor
- ✅ Máxima segurança
- ✅ Funciona perfeitamente com Certbot/Let's Encrypt

---

### 📊 **Comparação dos Modos SSL/TLS**

| Modo | Cloudflare → Visitante | Cloudflare → Servidor | Segurança | Recomendado |
|------|----------------------|---------------------|-----------|-------------|
| **Off** | ❌ HTTP | ❌ HTTP | Muito Baixa | ❌ Nunca |
| **Flexible** | ✅ HTTPS | ❌ HTTP | Baixa | ❌ Não |
| **Full** | ✅ HTTPS | ✅ HTTPS | Média | ⚠️ Aceitável |
| **Full (strict)** | ✅ HTTPS | ✅ HTTPS (validado) | Alta | ✅ **SIM** |

---

### 4️⃣ **Configurações Adicionais Recomendadas**

#### **SSL/TLS → Edge Certificates**

```
✅ Always Use HTTPS: ON
✅ HTTP Strict Transport Security (HSTS): Enable
✅ Minimum TLS Version: TLS 1.2
✅ Opportunistic Encryption: ON
✅ TLS 1.3: ON
✅ Automatic HTTPS Rewrites: ON
```

#### **Speed → Optimization**

```
✅ Auto Minify: JavaScript, CSS, HTML
✅ Brotli: ON
✅ Early Hints: ON
✅ Rocket Loader: OFF (pode causar problemas com Next.js)
```

#### **Caching → Configuration**

```
Browser Cache TTL: 4 hours (ou mais)
Caching Level: Standard
```

#### **Network**

```
✅ HTTP/2: ON
✅ HTTP/3 (with QUIC): ON
✅ 0-RTT Connection Resumption: ON
✅ WebSockets: ON
```

---

## 🔧 **Configuração Passo a Passo**

### **Passo 1: Adicionar Domínio no Cloudflare**

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Clique em **Add a Site**
3. Digite seu domínio (ex: `meusite.com`)
4. Escolha o plano **Free** (suficiente para maioria dos casos)
5. Cloudflare vai escanear seus DNS atuais

### **Passo 2: Configurar DNS**

1. Vá em **DNS** → **Records**
2. Adicione registro tipo **A**:
   - **Name:** `@` (para domínio principal) ou `app` (para subdomínio)
   - **IPv4 address:** IP do seu servidor Ubuntu
   - **Proxy status:** ✅ **Proxied** (nuvem laranja)
   - **TTL:** Auto
3. Clique em **Save**

### **Passo 3: Atualizar Nameservers**

1. Cloudflare vai mostrar 2 nameservers (ex: `ns1.cloudflare.com`, `ns2.cloudflare.com`)
2. Vá no painel do seu **registrador de domínio** (Registro.br, GoDaddy, Namecheap, etc.)
3. Substitua os nameservers atuais pelos do Cloudflare
4. Aguarde propagação (pode levar até 24h, mas geralmente 5-30 minutos)

### **Passo 4: Configurar SSL/TLS**

1. Vá em **SSL/TLS** → **Overview**
2. Selecione **Full (strict)**
3. Vá em **Edge Certificates**
4. Ative:
   - ✅ Always Use HTTPS
   - ✅ HSTS
   - ✅ Automatic HTTPS Rewrites

### **Passo 5: Executar o Script de Instalação**

Agora você pode rodar o script `instalarnext.sh` no Ubuntu:

```bash
sudo bash instalarnext.sh
```

O script vai:
1. ✅ Verificar se o DNS está configurado
2. ✅ Detectar se está usando proxy do Cloudflare
3. ✅ Instalar certificado SSL com Certbot
4. ✅ Configurar Nginx

---

## ✅ **Checklist de Configuração**

- [ ] Domínio adicionado no Cloudflare
- [ ] Registro DNS tipo A criado
- [ ] Proxy status: **Proxied** (nuvem laranja)
- [ ] Nameservers atualizados no registrador
- [ ] SSL/TLS mode: **Full (strict)**
- [ ] Always Use HTTPS: **ON**
- [ ] HSTS: **ON**
- [ ] HTTP/2 e HTTP/3: **ON**
- [ ] WebSockets: **ON**
- [ ] DNS propagado (teste com `dig seu-dominio.com`)

---

## 🔍 **Verificar Configuração**

### **Verificar DNS:**
```bash
dig seu-dominio.com A
# Deve retornar um IP do Cloudflare (se proxy ativo)
# ou o IP do seu servidor (se DNS only)
```

### **Verificar SSL:**
```bash
curl -I https://seu-dominio.com
# Deve retornar: HTTP/2 200
```

### **Verificar Proxy do Cloudflare:**
```bash
curl -I https://seu-dominio.com | grep -i cf-ray
# Se retornar algo, está usando proxy do Cloudflare
```

---

## ⚠️ **Troubleshooting**

### **Erro: "Too many redirects"**
- **Causa:** SSL mode no Cloudflare está em "Flexible" mas o servidor força HTTPS
- **Solução:** Mude para **Full (strict)** no Cloudflare

### **Erro: "SSL handshake failed"**
- **Causa:** Certificado SSL não instalado no servidor
- **Solução:** Execute `sudo certbot --nginx -d seu-dominio.com`

### **Site não carrega**
- **Causa:** DNS não propagou ou nameservers não atualizados
- **Solução:** Aguarde propagação ou verifique nameservers

### **WebSocket não funciona**
- **Causa:** WebSockets desabilitado no Cloudflare
- **Solução:** Vá em **Network** → Ative **WebSockets**

---

## 📚 **Resumo da Configuração Ideal**

```yaml
DNS:
  - Tipo: A
  - Proxy: Proxied (nuvem laranja) ✅
  
SSL/TLS:
  - Mode: Full (strict) ✅
  - Always Use HTTPS: ON ✅
  - HSTS: ON ✅
  - TLS 1.3: ON ✅
  
Network:
  - HTTP/2: ON ✅
  - HTTP/3: ON ✅
  - WebSockets: ON ✅
  
Speed:
  - Auto Minify: ON ✅
  - Brotli: ON ✅
```

---

**Última atualização:** Dezembro 2025
