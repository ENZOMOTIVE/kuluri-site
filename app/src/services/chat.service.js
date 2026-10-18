import { supabase, supabaseEnabled } from './supabase.js'

export const chatService = {
  // Get or create a chat between farm and worker for a job
  async getOrCreate(farmId, workerPrivyDid, jobId, jobTitle) {
    // Not configured: a local chat object, kept in memory by the caller.
    if (!supabaseEnabled) {
      return { id: `C-${farmId}-${workerPrivyDid}-${jobId}`, farm_id: farmId, worker_privy_did: workerPrivyDid, job_id: jobId, job_title: jobTitle, messages: [] }
    }
    // Try to find existing chat
    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .eq('farm_id', farmId)
      .eq('worker_privy_did', workerPrivyDid)
      .eq('job_id', jobId)
      .maybeSingle()

    if (existing) return existing

    // Create new chat
    const id = `C-${Date.now()}`
    const { data, error } = await supabase
      .from('chats')
      .insert({ id, farm_id: farmId, worker_privy_did: workerPrivyDid, job_id: jobId, job_title: jobTitle })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Fetch all chats for a farm
  async getForFarm(farmId) {
    if (!supabaseEnabled) return []
    const { data, error } = await supabase
      .from('chats')
      .select('*, messages(id, text, created_at, sender_role)')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: false })
    if (error) return []
    return data ?? []
  },

  // Fetch all chats for a worker (by privy_did)
  async getForWorker(workerPrivyDid) {
    if (!supabaseEnabled) return []
    const { data, error } = await supabase
      .from('chats')
      .select('*, messages(id, text, created_at, sender_role)')
      .eq('worker_privy_did', workerPrivyDid)
      .order('created_at', { ascending: false })
    if (error) return []
    return data ?? []
  },

  // Fetch messages for a chat
  async getMessages(chatId) {
    if (!supabaseEnabled) return []
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    if (error) return []
    return data ?? []
  },

  // Send a message
  async send(chatId, senderPrivyDid, senderRole, text, lang = 'en') {
    if (!supabaseEnabled) {
      return { id: `M-${Date.now()}`, chat_id: chatId, sender_id: senderPrivyDid, sender_role: senderRole, text, lang, created_at: new Date().toISOString() }
    }
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderPrivyDid,
        sender_role: senderRole,
        text,
        lang,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Subscribe to new messages in a chat (real-time)
  subscribe(chatId, onMessage) {
    if (!supabaseEnabled) return null // no real-time without a backend
    return supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => onMessage(payload.new))
      .subscribe()
  },

  unsubscribe(channel) {
    if (!supabaseEnabled || !channel) return
    supabase.removeChannel(channel)
  },
}
