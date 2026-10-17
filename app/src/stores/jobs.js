import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jobsService } from '../services/jobs.service.js'

export const useJobsStore = defineStore('jobs', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Applied / invited state keyed by `${jobId}:${workerId}`
  const invitations = ref({})

  async function fetchJobs() {
    loading.value = true
    error.value = null
    try {
      items.value = await jobsService.list()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function setInvitation(jobId, workerId, status) {
    invitations.value[`${jobId}:${workerId}`] = status
  }

  const openJobs = computed(() => items.value.filter((j) => j.status === 'Open'))

  return { items, loading, error, invitations, openJobs, fetchJobs, setInvitation }
})
