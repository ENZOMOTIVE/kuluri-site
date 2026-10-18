import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userService } from '../services/user.service.js'
import { demoIdentityFor } from '../data/demo-identities.js'

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
  const role = ref(localStorage.getItem('kuluri_role') ?? null)

  async function setRole(r) {
    role.value = r
    if (r) localStorage.setItem('kuluri_role', r)
    else localStorage.removeItem('kuluri_role')
    // Persist role to DB if we have a logged-in user
    if (user.value?.id) {
      await _syncToDb(r).catch(console.error)
    }
  }

  async function _syncToDb(overrideRole) {
    if (!user.value?.id) return
    const linked = user.value.linked_accounts ?? user.value.linkedAccounts ?? []
    const emailAcc = linked.find((a) => a.type === 'email' || a.type === 'google_oauth')
    const googleAcc = linked.find((a) => a.type === 'google_oauth')
    const nameFromGoogle = googleAcc?.name ?? user.value.google?.name ?? null
    const emailAddr = emailAcc?.address ?? user.value.email?.address ?? null
    await userService.upsert({
      privyDid: user.value.id,
      role: overrideRole ?? role.value,
      walletAddress: wallet.value?.address ?? null,
      email: emailAddr,
      displayName: nameFromGoogle ?? (emailAddr ? emailAddr.split('@')[0] : null),
    })
  }

  // ── Location ─────────────────────────────────────────────────────────────
  // Worker's base location — country + optional region, stored locally.
  const location = ref(JSON.parse(localStorage.getItem('kuluri_location') ?? 'null'))

  function setLocation(loc) {
    location.value = loc
    if (loc) localStorage.setItem('kuluri_location', JSON.stringify(loc))
    else localStorage.removeItem('kuluri_location')
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
    // Known demo address → land on the right side of the app, no role picker.
    // Only sets the role; it grants nothing the picker would not have given.
    if (!role.value) {
      const identity = demoIdentityFor(privyUser)
      if (identity) setRole(identity.role).catch(console.error)
    }
    // Sync user record to DB (fire-and-forget; role may still be null on first login)
    _syncToDb().catch(console.error)
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
    user, wallet, ready, loading, role, location,
    authenticated, walletAddress, shortAddress, displayName, avatarInitials,
    setRole, setLocation, _syncToDb,
    _onAuthenticated, _onWalletCreated, _onLogout, _setReady, _setLoading,
  }
})
