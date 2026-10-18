import { supabase, supabaseEnabled } from './supabase.js'

export const jobsService = {
  async list() {
    if (!supabaseEnabled) return [] // the prototype's seeded jobs are used instead
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return data ?? []
  },

  async listForFarm(farmerPrivyDid) {
    if (!supabaseEnabled) return []
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('farmer_privy_did', farmerPrivyDid)
      .order('created_at', { ascending: false })
    if (error) return []
    return data ?? []
  },

  async get(id) {
    if (!supabaseEnabled) return null
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return null
    return data
  },

  async create(farmerPrivyDid, payload) {
    // Not configured: echo the job back so the farmer flow completes locally.
    if (!supabaseEnabled) return { id: `J-${Date.now()}`, farmer_privy_did: farmerPrivyDid, ...payload }
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        farmer_privy_did: farmerPrivyDid,
        title: payload.title,
        start_date: payload.start ?? null,
        end_date: payload.end ?? null,
        pay_per_hour: payload.payPerHour ?? null,
        hours_per_week: payload.hoursPerWeek ?? null,
        housing: payload.housing ?? false,
        tasks: payload.tasks ?? [],
        languages: payload.languages ?? [],
        status: 'Open',
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateStatus(id, status) {
    if (!supabaseEnabled) return null
    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', id)
    if (error) throw error
  },
}
