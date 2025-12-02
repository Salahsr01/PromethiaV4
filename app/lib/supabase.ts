import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = 'https://ftysvyzrntsusgyqznsp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eXN2eXpybnRzdXNneXF6bnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDQwMDQsImV4cCI6MjA3OTkyMDAwNH0.z8lIsnbjy0lUPkiEDucYiLkcsJvmWo96iJL_CNvmkts'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0eXN2eXpybnRzdXNneXF6bnNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0NDAwNCwiZXhwIjoyMDc5OTIwMDA0fQ.xiUeuT768cjtTGoJJXaGJ-l55NPu_FQJFDgAKTKIWH0'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client pour le serveur (avec service role key pour les opérations admin)
export const createServerClient = () => {
  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

