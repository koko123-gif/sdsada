import { createClient } from '@supabase/supabase-js'

// Konfigurasi Supabase dengan validasi
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validasi apakah environment variables sudah dikonfigurasi dengan benar
export const isSupabaseConfigured = 
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL !== 'your_project_url_here' &&
  SUPABASE_ANON_KEY !== 'your_anon_key_here' &&
  SUPABASE_URL.includes('supabase.co')

// Buat client Supabase dengan fallback untuk mencegah error
export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://demo.supabase.co', 'demo-key-placeholder')

// Test koneksi Supabase
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase belum dikonfigurasi dengan benar')
    return false
  }

  try {
    const { data, error } = await supabase.from('voters').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

export type Voter = {
  id: string
  name: string
  address: string
  voted_for: string | null
  created_at: string
}

export type Vote = {
  id: string
  candidate_name: string
  user_id: string
  created_at: string
}