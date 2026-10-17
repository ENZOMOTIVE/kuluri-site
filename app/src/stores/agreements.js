import { defineStore } from 'pinia'
import { ref } from 'vue'
import { agreementsService } from '../services/agreements.service.js'

export const useAgreementsStore = defineStore('agreements', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetch() {
    loading.value = true
    try {
      items.value = await agreementsService.list()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function sign(agreementId, signature, walletAddress) {
    return agreementsService.sign(agreementId, signature, walletAddress)
  }

  return { items, loading, error, fetch, sign }
})
