import { supabase } from './supabase.js'

export const userService = {
  async upsert({ privyDid, role, walletAddress, email, displayName }) {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          privy_did: privyDid,
          role,
          wallet_address: walletAddress ?? null,
          email: email ?? null,
          display_name: displayName ?? null,
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

  // Fetch all registered workers to show alongside mock candidates
  async getWorkers() {
    const { data, error } = await supabase
      .from('users')
      .select('privy_did, email, display_name, wallet_address, role, skills, availability_start, availability_end, location_country, languages')
      .eq('role', 'worker')
    if (error) return []
    return data ?? []
  },

  // Update worker profile fields (skills, availability, languages, location)
  async updateWorkerProfile(privyDid, { skills, languages, availabilityStart, availabilityEnd, locationCountry }) {
    const { error } = await supabase
      .from('users')
      .update({
        skills: skills ?? [],
        languages: languages ?? [],
        availability_start: availabilityStart ?? null,
        availability_end: availabilityEnd ?? null,
        location_country: locationCountry ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('privy_did', privyDid)
    if (error) throw error
  },

  // Load own worker profile fields
  async getWorkerProfile(privyDid) {
    const { data, error } = await supabase
      .from('users')
      .select('skills, languages, availability_start, availability_end, location_country')
      .eq('privy_did', privyDid)
      .maybeSingle()
    if (error) return null
    return data
  },
}
