# 🚀 Comandos para Deploy no Ubuntu

## 📋 Configuração Inicial

### 1. Remover arquivo conflitante e fazer pull
```bash
cd /var/www/gasbutano
rm env.example.txt
git pull origin feature/upsell-cervejas
```

### 2. Configurar variáveis de ambiente
```bash
nano .env
```

Adicione:
```bash
# Porta do servidor
PORT=3001

# Google Ads
NEXT_PUBLIC_GOOGLE_ADS_TAGS=AW-17780793164

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://irfbwvfnmhcbxlxrthxs.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY0NTQxMSwiZXhwIjoyMDczMjIxEL6UEuOFr3KjShIDzvYlqtfFsO3Ytn0Obv30

# GhostPay
GHOSTPAY_API_KEY=sk_live_pSxehg4gNvbhn9zDQcfLTLF
GHOSTPAY_COMPANY_ID=741a7231-2223-471a
```

Salvar: `Ctrl + O`, `Enter`, `Ctrl + X`

### 3. Instalar dependências e fazer build
```bash
npm install
npm run build
```

---

## 🔄 Gerenciar PM2

### Opção 1: Usar arquivo de configuração (RECOMENDADO)
```bash
# Parar processo antigo
pm2 delete gasbutano

# Iniciar com configuração
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Ver status
pm2 status
```

### Opção 2: Comando direto
```bash
# Parar processo antigo
pm2 delete gasbutano

# Iniciar na porta 3001
PORT=3001 pm2 start npm --name "gasbutano" -- start

# Salvar
pm2 save

# Ver status
pm2 status
```

---

## 📊 Comandos Úteis

### Ver logs
```bash
pm2 logs gasbutano
```

### Ver logs em tempo real
```bash
pm2 logs gasbutano --lines 100
```

### Reiniciar aplicação
```bash
pm2 restart gasbutano
```

### Parar aplicação
```bash
pm2 stop gasbutano
```

### Ver processos rodando
```bash
pm2 list
```

### Ver qual processo está usando a porta 3000
```bash
lsof -i :3000
# ou
netstat -tulpn | grep 3000
```

### Matar processo na porta 3000 (se necessário)
```bash
# Descobrir PID
lsof -i :3000

# Matar processo
kill -9 <PID>
```

---

## 🔧 Troubleshooting

### Erro: "address already in use"
```bash
# Ver qual processo está usando a porta
pm2 list

# Parar todos os processos
pm2 stop all

# Ou deletar processo específico
pm2 delete gasbutano

# Reiniciar com nova porta
PORT=3001 pm2 start npm --name "gasbutano" -- start
```

### Erro: Build falha
```bash
# Limpar cache
rm -rf .next
npm run build
```

### Erro: Variáveis de ambiente não carregam
```bash
# Verificar se .env existe
cat .env

# Reiniciar PM2 completamente
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

---

## 🌐 Configurar Nginx (se necessário)

Se você usa Nginx como proxy reverso, atualize a configuração:

```bash
sudo nano /etc/nginx/sites-available/gasbutano
```

Atualize a porta:
```nginx
location / {
    proxy_pass http://localhost:3001;  # Porta atualizada
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Reiniciar Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Checklist de Deploy

- [ ] Pull do código
- [ ] Configurar `.env` com todas as variáveis
- [ ] `npm install`
- [ ] `npm run build`
- [ ] Parar processo antigo do PM2
- [ ] Iniciar com nova configuração (porta 3001)
- [ ] `pm2 save`
- [ ] Verificar logs: `pm2 logs gasbutano`
- [ ] Testar no navegador

---

**Última atualização:** Dezembro 2025
