# 🎯 Configurar Google Ads no Ubuntu

## 📋 Variáveis de Ambiente Necessárias

Você precisa configurar 2 variáveis de ambiente no arquivo `.env` do servidor Ubuntu:

```bash
NEXT_PUBLIC_GOOGLE_ADS_TAG=AW-17780793164
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION=AW-17780793164/XXXXXXX
```

⚠️ **Importante:** Substitua `XXXXXXX` pelo ID de conversão correto do Google Ads.

---

## 🔧 Como Configurar no Ubuntu

### 1️⃣ Criar/Editar o arquivo `.env`

```bash
# Navegue até a pasta do projeto
cd /var/www/gasbutano

# Crie ou edite o arquivo .env
nano .env
```

### 2️⃣ Adicionar as variáveis

Cole estas linhas no arquivo `.env`:

```bash
NEXT_PUBLIC_GOOGLE_ADS_TAG=AW-17780793164
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION=AW-17780793164/XXXXXXX
```

Salve com `Ctrl + O`, depois `Enter`, e saia com `Ctrl + X`.

### 3️⃣ Fazer build e restart

```bash
npm run build
pm2 restart all
```

---

## 📍 Onde as Tags São Usadas

### 1. **Tag Principal** (`NEXT_PUBLIC_GOOGLE_ADS_TAG`)
- **Arquivo:** `app/layout.tsx`
- **Uso:** Carrega o script do Google Ads em todas as páginas
- **Exemplo:** `AW-17780793164`

### 2. **Tag de Conversão** (`NEXT_PUBLIC_GOOGLE_ADS_CONVERSION`)
- **Arquivos:** 
  - `app/layout.tsx` (função de conversão)
  - `app/checkout/page.tsx` (conversão de compra)
  - `app/api/webhook/ghost/route.ts` (webhook Ghost)
  - `app/api/webhook/umb/route.ts` (webhook Umbrela)
- **Uso:** Dispara conversão quando pagamento é confirmado
- **Exemplo:** `AW-17780793164/abc123xyz`

---

## 🔍 Como Obter o ID de Conversão Completo

1. Acesse o **Google Ads**
2. Vá em **Ferramentas e Configurações** → **Conversões**
3. Clique na conversão desejada
4. Copie o **ID da conversão** (formato: `AW-XXXXXXXX/YYYYYYYY`)

---

## ✅ Verificar se Está Funcionando

Após configurar e fazer deploy:

1. Acesse o site
2. Faça uma compra de teste
3. Abra o **Console do navegador** (F12)
4. Procure por logs do Google Ads
5. Verifique no Google Ads se a conversão foi registrada (pode levar alguns minutos)

---

## 🚨 Troubleshooting

### Conversões não aparecem no Google Ads

**Possíveis causas:**
- Variáveis de ambiente não configuradas corretamente
- Build não foi feito após adicionar as variáveis
- ID de conversão incorreto
- Bloqueador de anúncios ativo no navegador

**Solução:**
```bash
# Verificar se as variáveis estão no .env
cat .env | grep GOOGLE_ADS

# Fazer build novamente
npm run build

# Reiniciar PM2
pm2 restart all

# Ver logs
pm2 logs
```

---

## 📝 Exemplo Completo de `.env`

```bash
# Google Ads
NEXT_PUBLIC_GOOGLE_ADS_TAG=AW-17780793164
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION=AW-17780793164/abc123xyz

# Outras variáveis...
```

---

**Última atualização:** Dezembro 2025
