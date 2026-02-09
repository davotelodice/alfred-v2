import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _server: SupabaseClient | null = null

function getServer(): SupabaseClient {
  if (!_server) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    _server = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return _server
}

export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_, p) { return (getServer() as unknown as Record<string, unknown>)[p as string] }
})