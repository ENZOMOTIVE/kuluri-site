import { createClient } from '@supabase/supabase-js'

// Supabase is optional: the prototype runs on local mock data when it is not
// configured. Creating the client with undefined values throws
// "supabaseUrl is required." at import time, which would stop the whole app
// from mounting — so only create it when both variables are set.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled ? createClient(url, anonKey) : null

if (!supabaseEnabled && import.meta.env.DEV) {
  console.info(
    '[kuluri] Supabase is not configured — running on local mock data. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in app/.env.local to persist users and chats.',
  )
}
