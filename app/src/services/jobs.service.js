// Jobs service — returns real data from the API when VITE_API_BASE is set,
// otherwise falls back to the local mock dataset.
import { api } from './api.js'
import { state } from '../data/store.js'

export const jobsService = {
  async list() {
    try { return await api.get('/jobs') } catch (_) {}
    return state.jobs
  },
  async get(id) {
    try { return await api.get(`/jobs/${id}`) } catch (_) {}
    return state.jobs.find((j) => j.id === id) ?? null
  },
  async create(payload) {
    try { return await api.post('/jobs', payload) } catch (_) {}
    const job = { id: `J-${Date.now()}`, status: 'Open', ...payload }
    state.jobs.push(job)
    return job
  },
  async invite(jobId, workerId) {
    try { return await api.post(`/jobs/${jobId}/invite`, { workerId }) } catch (_) {}
    state.invitations[`${jobId}:${workerId}`] = 'Invited'
    return { jobId, workerId, status: 'Invited' }
  },
}
