-- =============================================
-- TABELA: payment_receipts
-- Armazena comprovantes de pagamento enviados pelo chat de suporte
-- =============================================

-- Criar tabela payment_receipts
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id VARCHAR(255) NOT NULL,
  receipt_url TEXT,
  receipt_filename VARCHAR(500),
  ghost_status VARCHAR(50) DEFAULT 'unknown',
  amount INTEGER DEFAULT 0,
  customer_message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment_id ON payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_resolved ON payment_receipts(resolved);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_created_at ON payment_receipts(created_at DESC);

-- =============================================
-- STORAGE BUCKET: receipts
-- Para armazenar os arquivos de comprovante
-- =============================================

-- Criar bucket 'receipts' no Supabase Storage (via Dashboard ou SQL)
-- No Dashboard: Storage > New Bucket > Nome: receipts > Public: true

-- Se quiser via SQL (requer permissões):
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acesso público para leitura
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'receipts');

-- Política para upload (apenas via service_role - backend)
CREATE POLICY "Service Upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'receipts');

-- =============================================
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- 4. Em Storage, verifique se o bucket 'receipts' foi criado
--    Se não, crie manualmente: Storage > New Bucket > receipts > Public
-- =============================================
