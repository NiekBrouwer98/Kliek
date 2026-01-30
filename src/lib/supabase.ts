import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('Kliek: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Sync will be disabled.')
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const hasSupabase = () => Boolean(supabase)
