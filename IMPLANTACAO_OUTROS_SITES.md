# 🚀 GUIA DE IMPLANTAÇÃO - Outros Sites

## 📋 Pré-requisitos

Antes de implantar em outros sites, você precisa:

1. ✅ Ter o código funcionando localmente
2. ✅ Ter as credenciais do Google Sheets (`chavesheets.json`)
3. ✅ Ter a chave da API do UTMify
4. ✅ Ter acesso ao servidor de deploy (Ubuntu 24)

---

## 🔧 PASSO 1: Preparar o Código

### 1.1. Clonar o repositório no servidor

```bash
# SSH no servidor Ubuntu
ssh usuario@seu-servidor.com

# Navegar para o diretório de projetos
cd /var/www

# Clonar o repositório
git clone https://github.com/seu-usuario/unigas-2.git nome-do-site
cd nome-do-site
```

### 1.2. Instalar dependências

```bash
npm install
```

### 1.3. Copiar arquivos de configuração

```bash
# Copiar chavesheets.json
scp d:\2025_ARTHUR\unigas-2\chavesheets.json usuario@servidor:/var/www/nome-do-site/

# Ou criar manualmente no servidor
nano chavesheets.json
# Cole o conteúdo do arquivo chavesheets.json
```

---

## ⚙️ PASSO 2: Configurar Variáveis de Ambiente

### 2.1. Criar arquivo `.env`

```bash
nano .env
```

### 2.2. Adicionar variáveis

```env
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=19noK4HT3COT-r-dJU3ZE6WRZvZMmffdRo0DzJDr0cwI

# UTMify
UTMIFY_API_KEY=YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV

# Ghost Pay (se usar)
GHOST_PAY_API_KEY=sua_chave_aqui

# Domínio do site
NEXT_PUBLIC_SITE_URL=https://seusite.com
```

---

## 📊 PASSO 3: Configurar Google Sheets

### 3.1. Compartilhar planilha com Service Account

1. Abra a planilha do Google Sheets
2. Clique em **Compartilhar**
3. Adicione o email do service account:
   ```
   sheets-api@solar-bebop-469002-h1.iam.gserviceaccount.com
   ```
4. Permissão: **Editor**
5. Clique em **Enviar**

### 3.2. Atualizar ID da planilha (se for outra planilha)

Edite `lib/google-sheets.ts`:

```typescript
const SPREADSHEET_ID = 'SEU_ID_AQUI'; // Pegar da URL da planilha
```

---

## 🏗️ PASSO 4: Build e Deploy

### 4.1. Build da aplicação

```bash
npm run build
```

### 4.2. Iniciar em produção

**Opção A: PM2 (Recomendado)**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "nome-do-site" -- start

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

**Opção B: Systemd**

Criar arquivo `/etc/systemd/system/nome-do-site.service`:

```ini
[Unit]
Description=Nome do Site
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/nome-do-site
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl enable nome-do-site
sudo systemctl start nome-do-site
```

---

## 🌐 PASSO 5: Configurar Nginx

### 5.1. Criar configuração do site

```bash
sudo nano /etc/nginx/sites-available/nome-do-site
```

### 5.2. Adicionar configuração

```nginx
server {
    listen 80;
    server_name seusite.com www.seusite.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.3. Ativar site

```bash
sudo ln -s /etc/nginx/sites-available/nome-do-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.4. Configurar SSL (Certbot)

```bash
sudo certbot --nginx -d seusite.com -d www.seusite.com
```

---

## 🔍 PASSO 6: Configurar UTMs e Tracking

### 6.1. Adicionar script do UTMify

No `app/layout.tsx`, o script já está configurado:

```typescript
<Script
  id="utmify-script"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      !function(){var t=window.utmify=window.utmify||[];if(t.invoked)window.console&&console.error&&console.error("UTMify snippet included twice.");else{t.invoked=!0,t.methods=["trackPageview","trackEvent","identify"],t.factory=function(e){return function(){var n=Array.prototype.slice.call(arguments);return n.unshift(e),t.push(n),t}};for(var e=0;e<t.methods.length;e++){var n=t.methods[e];t[n]=t.factory(n)}t.load=function(e){var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://cdn.utmify.com.br/scripts/utmify.js";var i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(n,i),t._loadOptions=e},t.SNIPPET_VERSION="1.0.0",t.load({apiKey:"YooXTNvyvZqDBvhnNIX0FHBQAyYzr6E2JjHV"})}}();
    `,
  }}
/>
```

### 6.2. Verificar captura de UTMs

No `app/page.tsx`, os UTMs são capturados automaticamente:

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const utmParams = {
    src: params.get('src'),
    sck: params.get('sck'),
    utm_source: params.get('utm_source'),
    utm_campaign: params.get('utm_campaign'),
    utm_medium: params.get('utm_medium'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    keyword: params.get('keyword'),
    device: params.get('device'),
    network: params.get('network'),
    gclid: params.get('gclid'),
    gbraid: params.get('gbraid'),
    wbraid: params.get('wbraid'),
    fbclid: params.get('fbclid')
  }
  localStorage.setItem('utm-params', JSON.stringify(utmParams))
}, [])
```

---

## 🧪 PASSO 7: Testar

### 7.1. Testar captura de UTMs

Acesse:
```
https://seusite.com/?utm_source=google&utm_campaign=teste&gclid=test123
```

Verifique no console do navegador se os UTMs foram salvos no localStorage.

### 7.2. Testar webhook

```bash
curl "https://seusite.com/api/test-webhook?email=teste@email.com&name=Teste&amount=4990"
```

### 7.3. Verificar Google Sheets

1. Abra a planilha
2. Verifique se foi criada uma aba com o nome do projeto
3. Verifique se os dados foram salvos corretamente

---

## 📝 PASSO 8: Monitoramento

### 8.1. Ver logs da aplicação

**PM2:**
```bash
pm2 logs nome-do-site
```

**Systemd:**
```bash
sudo journalctl -u nome-do-site -f
```

### 8.2. Verificar status

**PM2:**
```bash
pm2 status
```

**Systemd:**
```bash
sudo systemctl status nome-do-site
```

---

## 🔄 PASSO 9: Atualizações

### 9.1. Atualizar código

```bash
cd /var/www/nome-do-site
git pull origin main
npm install
npm run build
```

### 9.2. Reiniciar aplicação

**PM2:**
```bash
pm2 restart nome-do-site
```

**Systemd:**
```bash
sudo systemctl restart nome-do-site
```

---

## ⚠️ TROUBLESHOOTING

### Problema: Dados não estão sendo salvos no Google Sheets

**Solução:**
1. Verifique se o `chavesheets.json` está no diretório raiz
2. Verifique se a planilha foi compartilhada com o service account
3. Verifique os logs: `pm2 logs nome-do-site`

### Problema: UTMs não estão sendo capturados

**Solução:**
1. Verifique se o script do UTMify está carregando
2. Abra o console do navegador e veja se há erros
3. Verifique o localStorage: `localStorage.getItem('utm-params')`

### Problema: Webhook não está funcionando

**Solução:**
1. Verifique se o Ghost Pay está enviando para a URL correta
2. Verifique os logs do webhook: `pm2 logs nome-do-site | grep webhook`
3. Teste manualmente: `curl https://seusite.com/api/test-webhook?email=teste@email.com&amount=4990`

---

## 📊 CHECKLIST FINAL

Antes de considerar a implantação completa:

- [ ] Código clonado e dependências instaladas
- [ ] Arquivo `.env` configurado
- [ ] `chavesheets.json` copiado
- [ ] Planilha compartilhada com service account
- [ ] Build executado com sucesso
- [ ] Aplicação rodando em produção (PM2 ou Systemd)
- [ ] Nginx configurado
- [ ] SSL configurado (HTTPS)
- [ ] UTMs sendo capturados corretamente
- [ ] Webhook testado e funcionando
- [ ] Dados sendo salvos no Google Sheets
- [ ] Conversões sendo enviadas para UTMify
- [ ] Conversões sendo enviadas para Google Ads

---

## 🎯 SITES MÚLTIPLOS

Para cada novo site, repita os passos acima, mas:

1. **Use uma porta diferente** para cada site (3000, 3001, 3002, etc.)
2. **Crie uma configuração Nginx separada** para cada domínio
3. **Use o mesmo `chavesheets.json`** (todos os sites salvam na mesma planilha)
4. **Cada site terá sua própria aba** na planilha (baseado no domínio)

---

## 📞 SUPORTE

Se tiver problemas:

1. Verifique os logs
2. Teste cada componente separadamente
3. Verifique as permissões do Google Sheets
4. Verifique se as variáveis de ambiente estão corretas

---

**Boa sorte com a implantação! 🚀**
