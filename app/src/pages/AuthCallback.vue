<script setup>
// OAuth callback — Google redirects here after the user signs in.
// Reads `code` and `state` from the URL query string, completes auth, then navigates.
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePrivy } from '../composables/usePrivy.js'
import { useAuthStore } from '../stores/auth.js'
import KuluriLogo from '../components/KuluriLogo.vue'

const router = useRouter()
const auth = useAuthStore()
const { completeOAuthCallback } = usePrivy()
const status = ref('Completing sign-in…')
const failed = ref(false)

onMounted(async () => {
  // OAuth params arrive as ?code=…&state=… on the base URL (before the hash)
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  if (!code || !state) {
    failed.value = true
    status.value = 'No auth code found. Please try signing in again.'
    return
  }

  // Clean params from the URL bar without triggering a reload
  window.history.replaceState({}, '', window.location.pathname)

  const ok = await completeOAuthCallback(code, state)
  if (ok) {
    // If user already chose a role before, go straight to their app
    const role = auth.role
    router.replace(role === 'farmer' ? '/farm' : role === 'worker' ? '/worker' : '/select-role')
  } else {
    failed.value = true
    status.value = 'Sign-in failed. Please try again.'
  }
})
</script>

<template>
  <div class="auth-wrap">
    <div class="column items-center q-gutter-y-lg">
      <KuluriLogo :size="36" />
      <q-spinner v-if="!failed" color="primary" size="40px" />
      <q-icon v-else name="o_error_outline" color="negative" size="40px" />
      <div class="text-body1 text-center" :class="failed ? 'text-negative' : 'text-muted'">{{ status }}</div>
      <q-btn v-if="failed" unelevated no-caps color="primary" to="/login">Back to sign-in</q-btn>
    </div>
  </div>
</template>

<style scoped>
.auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--page-bg); }
</style>
