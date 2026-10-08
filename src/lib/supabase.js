import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bggptxjtpnvfvgejlbyp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OhxmW3vmxh_iClRdKbQEXg_r6u0-FPf'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
