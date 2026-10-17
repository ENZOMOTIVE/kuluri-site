import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Auth store: owns the Privy session, user object, embedded wallet, and role.
// The Privy client is initialised once in composables/usePrivy.js and its state
// is mirrored here so components never import the Privy SDK directly.
export const useAuthStore = defineStore('auth', () => {
  // ── Privy user ───────────────────────────────────────────────────────────
  const user = ref(null)          // Privy user object (id, email, google, …)
  const wallet = ref(null)        // embedded wallet { address, chainType, … }
  const ready = ref(false)        // Privy SDK initialised
  const loading = ref(false)

  // ── Role ────────────────────────────────────────────────────────────────
  // Stored in localStorage so it survives page refresh.
  const role = ref(localStorage.getItem('kuluri_role') ?? null) // 'farmer' | 'worker' | null

  function setRole(r) {
    role.value = r
    if (r) localStorage.setItem('kuluri_role', r)
    else localStorage.removeItem('kuluri_role')
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const authenticated = computed(() => !!user.value)
  const walletAddress = computed(() => wallet.value?.address ?? null)
  const shortAddress = computed(() => {
    const a = walletAddress.value
    return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : null
  })
  const displayName = computed(() => {
    if (!user.value) return null
    const u = user.value
    // Direct fields (mock / some SDK versions)
    if (u.google?.name) return u.google.name
    if (u.email?.address) return u.email.address
    // Real Privy SDK: email info lives in linked_accounts / linkedAccounts array
    const linked = u.linked_accounts ?? u.linkedAccounts ?? []
    const googleAcc = linked.find((a) => a.type === 'google_oauth')
    if (googleAcc?.name) return googleAcc.name
    const emailAcc = linked.find((a) => a.type === 'email')
    if (emailAcc?.address) return emailAcc.address
    // Last resort: wallet short address
    return shortAddress.value ?? null
  })
  const avatarInitials = computed(() => {
    const n = displayName.value ?? ''
    return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'
  })

  // ── Mutations (called by usePrivy composable) ────────────────────────────
  function _onAuthenticated(privyUser, embeddedWallet) {
    user.value = privyUser
    wallet.value = embeddedWallet ?? null
    ready.value = true
    loading.value = false
  }

  function _onWalletCreated(embeddedWallet) {
    wallet.value = embeddedWallet
  }

  function _onLogout() {
    user.value = null
    wallet.value = null
    // Keep role so re-login lands on the right app
  }

  function _setReady(val) { ready.value = val }
  function _setLoading(val) { loading.value = val }

  return {
    user, wallet, ready, loading, role,
    authenticated, walletAddress, shortAddress, displayName, avatarInitials,
    setRole,
    _onAuthenticated, _onWalletCreated, _onLogout, _setReady, _setLoading,
  }
})
