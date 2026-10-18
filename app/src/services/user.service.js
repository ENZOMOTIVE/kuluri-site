import { supabase, supabaseEnabled } from './supabase.js'

export const userService = {
  async upsert({ privyDid, role, walletAddress, email }) {
    // Not configured: hand back the same shape from the arguments, so sign-in
    // works on local mock data.
    if (!supabaseEnabled) {
      return { privy_did: privyDid, role, wallet_address: walletAddress ?? null, email: email ?? null }
    }
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          privy_did: privyDid,
          role,
          wallet_address: walletAddress ?? null,
          email: email ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'privy_did' },
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getByDid(privyDid) {
    if (!supabaseEnabled) return null
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('privy_did', privyDid)
      .maybeSingle()
    if (error) throw error
    return data
  },

  // Fetch all registered workers to show alongside mock candidates
  async getWorkers() {
    if (!supabaseEnabled) return [] // mock candidates still show
    const { data, error } = await supabase
      .from('users')
      .select('privy_did, email, wallet_address, role, skills, availability_start, availability_end, location_country, languages')
      .eq('role', 'worker')
    if (error) return [] // fail silently — mock data still shows
    return data ?? []
  },
}
