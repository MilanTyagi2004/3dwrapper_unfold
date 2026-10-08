import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://bggptxjtpnvfvgejlbyp.supabase.co'
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OhxmW3vmxh_iClRdKbQEXg_r6u0-FPf'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
