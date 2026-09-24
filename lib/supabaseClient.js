import { createClient } from '@supabase/supabase-js'

// ค่าจาก Environment Variables (ตั้งใน Vercel) ห้ามใส่ key ลงในโค้ด
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
