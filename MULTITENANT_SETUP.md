# 🌐 Configuração Multi-Tenant - Sistema de Gás

## 📋 Visão Geral

Sistema simples de multi-tenant que permite usar **diferentes tags do Google Ads por domínio**, mantendo todo o resto da aplicação igual.

---

## 🎯 O que foi implementado:

### **1. Arquivo de Configuração** (`lib/domain-config.ts`)

Centraliza todas as tags do Google Ads por domínio:

```typescript
export const domainConfigs: Record<string, DomainConfig> = {
  'localhost': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY'
  },
  
  'configas.com.br': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/XXXXXXX',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/YYYYYYY'
  },
  
  'outrodominio.com.br': {
    GOOGLE_ADS_TAG: 'AW-XXXXXXXXXX',
    GOOGLE_ADS_CONVERSION: 'AW-XXXXXXXXXX/YYYYYYY',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-XXXXXXXXXX/ZZZZZZZ'
  },
};
```

### **2. Middleware** (`middleware.ts`)

Captura o hostname e disponibiliza para o servidor:

```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || 'localhost'
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hostname', hostname)
  
  return NextResponse.next({
    request: { headers: requestHeaders }
  })
}
```

### **3. Layout Multi-Tenant** (`app/layout-multitenant.tsx`)

Layout adaptado que lê as tags dinamicamente por domínio:

```typescript
const headersList = headers()
const hostname = headersList.get('x-hostname') || 'localhost'
const domainConfig = getDomainConfig(hostname)
const googleAdsTag = domainConfig.GOOGLE_ADS_TAG
```

---

## 🚀 Como Usar:

### **Passo 1: Adicionar Novo Domínio**

Edite `lib/domain-config.ts` e adicione o novo domínio:

```typescript
'meunovodominio.com.br': {
  GOOGLE_ADS_TAG: 'AW-XXXXXXXXXX',
  GOOGLE_ADS_CONVERSION: 'AW-XXXXXXXXXX/YYYYYYY',
  GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-XXXXXXXXXX/ZZZZZZZ'
},
```

### **Passo 2: Ativar Layout Multi-Tenant**

Renomeie os arquivos:

```bash
# Backup do layout original
mv app/layout.tsx app/layout-original.tsx

# Ativar layout multi-tenant
mv app/layout-multitenant.tsx app/layout.tsx
```

### **Passo 3: Rebuild e Deploy**

```bash
npm run build
pm2 restart gasbutano
```

---

## 📊 Como Funciona:

### **Fluxo de Requisição:**

1. **Cliente acessa** `configas.com.br`
2. **Middleware** captura hostname → `configas.com.br`
3. **Layout** lê configuração do domínio
4. **Google Ads Tag** é injetada dinamicamente: `AW-17780793164`

### **Outro Domínio:**

1. **Cliente acessa** `outrodominio.com.br`
2. **Middleware** captura hostname → `outrodominio.com.br`
3. **Layout** lê configuração do domínio
4. **Google Ads Tag** é injetada dinamicamente: `AW-XXXXXXXXXX`

---

## 🎯 Usar Tags em Componentes:

As tags ficam disponíveis globalmente via `window.DOMAIN_CONFIG`:

```typescript
// Em qualquer componente client-side
declare global {
  interface Window {
    DOMAIN_CONFIG: {
      GOOGLE_ADS_TAG: string;
      GOOGLE_ADS_CONVERSION: string;
      GOOGLE_ADS_INITIATE_CHECKOUT?: string;
    }
  }
}

// Usar no código
const conversionTag = window.DOMAIN_CONFIG.GOOGLE_ADS_CONVERSION;

// Disparar conversão
gtag('event', 'conversion', {
  'send_to': conversionTag,
  'value': 1.0,
  'currency': 'BRL',
  'transaction_id': txId
});
```

---

## 📝 Exemplo de Uso Completo:

### **Arquivo: `lib/domain-config.ts`**

```typescript
export const domainConfigs: Record<string, DomainConfig> = {
  'localhost': {
    GOOGLE_ADS_TAG: 'AW-17780793164',
    GOOGLE_ADS_CONVERSION: 'AW-17780793164/abc123',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-17780793164/xyz789'
  },
  
  'gasbutano.com.br': {
    GOOGLE_ADS_TAG: 'AW-11111111111',
    GOOGLE_ADS_CONVERSION: 'AW-11111111111/conv123',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-11111111111/init456'
  },
  
  'gasrapido.com.br': {
    GOOGLE_ADS_TAG: 'AW-22222222222',
    GOOGLE_ADS_CONVERSION: 'AW-22222222222/conv789',
    GOOGLE_ADS_INITIATE_CHECKOUT: 'AW-22222222222/init012'
  },
};
```

### **Nginx - Configurar Múltiplos Domínios:**

```nginx
server {
    listen 80;
    server_name gasbutano.com.br www.gasbutano.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name gasrapido.com.br www.gasrapido.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## ✅ Vantagens desta Abordagem:

- ✅ **Simples** - Apenas 3 arquivos novos
- ✅ **Centralizado** - Todas as tags em um lugar
- ✅ **Sem variáveis de ambiente** - Não precisa reconfigurar .env
- ✅ **Sem rebuild por domínio** - Um build serve todos os domínios
- ✅ **Fácil de manter** - Adicionar domínio = editar 1 arquivo

---

## 🔧 Troubleshooting:

### **Tags não estão mudando por domínio:**

1. Verifique se o middleware está ativo
2. Verifique se o domínio está em `domain-config.ts`
3. Veja os logs: `pm2 logs gasbutano`

### **Erro "Cannot find module":**

```bash
# Reinstalar dependências
rm -rf node_modules
npm install
npm run build
```

### **Domínio não encontrado:**

O sistema usa `localhost` como fallback. Adicione o domínio em `domain-config.ts`.

---

## 📞 Integração com Admin Domains (Futuro):

Para integrar com o sistema de admin-domains.php existente:

1. Criar API para ler/escrever `domain-config.ts`
2. Adicionar campo "Google Ads Tag" no admin-domains.html
3. Salvar tags via API ao invés de editar arquivo manualmente

---

**Sistema multi-tenant pronto para uso!** 🚀
