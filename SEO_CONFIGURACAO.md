# 🔍 Configuração de SEO Profissional

## ✅ O que foi implementado:

### 1. **Metadata Completa** (`app/layout.tsx`)
- ✅ Title otimizado com palavras-chave
- ✅ Description atrativa e informativa
- ✅ Keywords relevantes (15 termos principais)
- ✅ Open Graph (Facebook, LinkedIn)
- ✅ Twitter Cards
- ✅ Canonical URLs
- ✅ Robots directives

### 2. **Schema.org - LocalBusiness**
- ✅ Dados estruturados para Google
- ✅ Informações de negócio local
- ✅ Horário de funcionamento
- ✅ Avaliações agregadas
- ✅ Localização geográfica

### 3. **Arquivos de SEO**
- ✅ `robots.txt` - Controle de rastreamento
- ✅ `sitemap.ts` - Mapa do site automático
- ✅ Idioma correto (pt-BR)

---

## 📋 Checklist de Configuração

### No `.env` adicione:

```bash
# URL do site
NEXT_PUBLIC_SITE_URL=https://distribuidoraconfigas.store

# Google Site Verification (opcional)
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=seu_codigo_aqui
```

---

## 🎯 Keywords Implementadas

1. **Principais:**
   - entrega de gás
   - gás de cozinha
   - água mineral delivery
   - botijão de gás

2. **Produtos:**
   - gás P13
   - gás P45
   - água mineral 20L

3. **Diferenciais:**
   - entrega rápida
   - entrega em 30 minutos
   - pagamento PIX
   - desconto PIX
   - gás 24 horas

---

## 🌐 Open Graph (Redes Sociais)

Quando alguém compartilhar seu site no Facebook/WhatsApp/LinkedIn, aparecerá:

- **Título:** Configás - Entrega de Gás e Água em até 30 Minutos
- **Descrição:** Entrega expressa de gás de cozinha e água mineral...
- **Imagem:** `/images/og-image.png` (1200x630px)

### ⚠️ Criar imagem OG:
Crie uma imagem em `/public/images/og-image.png` com:
- Dimensões: 1200x630px
- Logo da empresa
- Texto: "Entrega em 30 minutos"
- Cores da marca

---

## 🤖 Schema.org - Dados Estruturados

O Google entenderá seu site como um **Negócio Local** com:

- Nome: Configás
- Tipo: LocalBusiness
- Horário: 24/7
- Avaliação: 4.8/5 (150 reviews)
- Localização: Brasil

### 📝 Personalize no `app/layout.tsx`:

```typescript
telephone: '+55-11-99999-9999',  // Seu telefone
addressLocality: 'São Paulo',     // Sua cidade
addressRegion: 'SP',              // Seu estado
latitude: -23.550520,             // Sua latitude
longitude: -46.633308,            // Sua longitude
```

---

## 🗺️ Sitemap

O Next.js gera automaticamente em:
- `https://seusite.com/sitemap.xml`

Páginas incluídas:
- `/` (Homepage) - Prioridade: 1.0
- `/checkout` - Prioridade: 0.9

---

## 🚫 Robots.txt

Configurado para:
- ✅ Permitir rastreamento geral
- ❌ Bloquear páginas admin
- ❌ Bloquear APIs
- ✅ Permitir imagens

---

## 📊 Google Search Console

### 1. Verificar propriedade:
```bash
# Adicione no .env:
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=abc123xyz
```

### 2. Enviar sitemap:
1. Acesse: https://search.google.com/search-console
2. Adicione propriedade: `distribuidoraconfigas.store`
3. Verifique com meta tag
4. Envie sitemap: `https://distribuidoraconfigas.store/sitemap.xml`

---

## 🎨 Melhorias Recomendadas

### 1. **Criar imagem OG** (`/public/images/og-image.png`)
```
Dimensões: 1200x630px
Conteúdo:
- Logo Configás
- "Entrega em 30 minutos"
- "Gás e Água"
- Telefone de contato
```

### 2. **Adicionar favicon**
Crie em `/public/`:
- `favicon.ico` (32x32px)
- `apple-touch-icon.png` (180x180px)

### 3. **Configurar Google Analytics**
Já tem Google Ads, adicione Analytics também.

### 4. **Adicionar avaliações reais**
Colete reviews de clientes e atualize:
```typescript
aggregateRating: {
  ratingValue: '4.8',
  reviewCount: '150',
}
```

---

## 🔍 Testar SEO

### Ferramentas:
1. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - Teste o schema.org

2. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/
   - Teste Open Graph

3. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator
   - Teste Twitter Cards

4. **PageSpeed Insights**
   - https://pagespeed.web.dev/
   - Teste performance

5. **Mobile-Friendly Test**
   - https://search.google.com/test/mobile-friendly
   - Teste responsividade

---

## 📈 Métricas de Sucesso

Após implementação, monitore:
- Posição no Google para "entrega de gás [sua cidade]"
- Impressões no Search Console
- CTR (Click-Through Rate)
- Taxa de conversão
- Tempo na página

---

## 🚀 Próximos Passos

1. ✅ Deploy das alterações
2. ⬜ Criar imagem OG (1200x630px)
3. ⬜ Configurar Google Search Console
4. ⬜ Enviar sitemap
5. ⬜ Adicionar telefone e endereço reais no schema
6. ⬜ Coletar avaliações de clientes
7. ⬜ Criar conteúdo de blog (opcional)
8. ⬜ Configurar Google My Business

---

**Última atualização:** Dezembro 2025
