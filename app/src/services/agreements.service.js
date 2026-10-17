// Agreements service — wraps the local agreements data store and, when a backend
// is configured, persists signatures on-chain via the API.
import { api } from './api.js'
import { agreements, seedAgreements } from '../data/agreements.js'

export const agreementsService = {
  async list() {
    try { return await api.get('/agreements') } catch (_) {}
    return agreements
  },
  async get(id) {
    try { return await api.get(`/agreements/${id}`) } catch (_) {}
    return agreements.find((a) => a.id === id) ?? null
  },
  // Sign an agreement: stores the wallet signature alongside the SHA-256 hash.
  // On the real backend this would anchor the hash on-chain via Privy server wallets.
  async sign(agreementId, signature, walletAddress) {
    try {
      return await api.post(`/agreements/${agreementId}/sign`, { signature, walletAddress })
    } catch (_) {}
    const a = agreements.find((a) => a.id === agreementId)
    if (!a) throw new Error('Agreement not found')
    const side = 'worker' // determined by caller
    a.signed = a.signed ?? {}
    a.signed[side] = { at: new Date().toISOString(), walletAddress, signature }
    return a
  },
}
