import { supabase } from './supabase.js'

export const userService = {
  async upsert({ privyDid, role, walletAddress, email }) {
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('privy_did', privyDid)
      .maybeSingle()
    if (error) throw error
    return data
  },
}
