import { supabase } from './supabase.js'

export const jobsService = {
  async list() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return []
    return data ?? []
  },

  async listForFarm(farmerPrivyDid) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('farmer_privy_did', farmerPrivyDid)
      .order('created_at', { ascending: false })
    if (error) return []
    return data ?? []
  },

  async get(id) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return null
    return data
  },

  async create(farmerPrivyDid, payload) {
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
    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', id)
    if (error) throw error
  },
}
