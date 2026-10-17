import { supabase } from './supabase.js'

export const chatService = {
  async loadThread(threadId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async send({ userDid, threadId, sender, content }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ user_did: userDid, thread_id: threadId, sender, content })
      .select()
      .single()
    if (error) throw error
    return data
  },

  subscribeToThread(threadId, callback) {
    return supabase
      .channel(`chat:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
        (payload) => callback(payload.new),
      )
      .subscribe()
  },
}
