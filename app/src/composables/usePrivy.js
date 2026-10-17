// Privy Vue composable — wraps @privy-io/js-sdk-core (the only Privy option for Vue 3).
// Real API: new Privy({ appId }) → privy.auth.oauth / privy.auth.email / privy.embeddedWallet
//
// Google OAuth uses a redirect flow:
//   1. loginWithGoogle() → generates the Google URL, stores state, redirects the window
//   2. On return, the app calls completeOAuthCallback() (triggered by AuthCallback.vue)
//
// Call initPrivy(appId) once from main.js AFTER Pinia is ready.
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'

let _privy = null  // Privy singleton

// ── Initialise ──────────────────────────────────────────────────────────────
export async function initPrivy(appId) {
  const auth = useAuthStore()

  if (!appId || appId === 'PRIVY_APP_ID_PLACEHOLDER') {
    console.warn('[Privy] No app ID — mock auth mode active.')
    auth._setReady(true)
    return
  }

  try {
    const { default: Privy, getUserEmbeddedEthereumWallet, LocalStorage } = await import('@privy-io/js-sdk-core')
    // Use the SDK's built-in LocalStorage adapter (uses localStorage under the hood)
    _privy = new Privy({ appId, storage: new LocalStorage() })

    // Restore existing session
    const token = await _privy.getAccessToken().catch(() => null)
    if (token) {
      const res = await _privy.user.get().catch(() => null)
      // user.get() returns { user: User }
      const userData = res?.user ?? res
      if (userData) {
        let linked = getUserEmbeddedEthereumWallet(userData)
        // Fallback: scan linkedAccounts directly
        if (!linked) {
          const accs = userData.linked_accounts ?? userData.linkedAccounts ?? []
          const w = accs.find((a) => a.wallet_client_type === 'privy' && a.connector_type === 'embedded')
            ?? accs.find((a) =>
              (a.type === 'wallet' || a.connector_type === 'embedded') &&
              (a.wallet_client_type === 'privy' || a.walletClientType === 'privy')
            )
          if (w?.address) linked = { address: w.address, chainType: 'ethereum', walletClientType: 'privy' }
        }
        // Local wallet fallback for Capacitor (no Privy iframe proxy)
        if (!linked) {
          const address = await _getOrCreateLocalWallet(userData.id)
          if (address) linked = { address, chainType: 'ethereum', walletClientType: 'local' }
        }
        auth._onAuthenticated(userData, linked ? { address: linked.address, chainType: 'ethereum', walletClientType: linked.walletClientType } : null)
        auth._setReady(true)
        return
      }
    }

    auth._setReady(true)
  } catch (e) {
    console.error('[Privy] Init error:', e)
    auth._setReady(true)
  }
}

// ── OAuth redirect URI ────────────────────────────────────────────────────────
// On Capacitor Android the origin is https://localhost (no port, no path).
// On web dev it is http://localhost:5173.
// Both must be registered in Privy dashboard AND Google OAuth client.
function _redirectUri() {
  // Capacitor serves from https://localhost/index.html — strip the path so the
  // redirect URI is just https://localhost (must match exactly what's registered).
  const isCapacitor = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform?.()
  return isCapacitor ? window.location.origin : `${window.location.origin}${window.location.pathname}`
}

// ── Composable ───────────────────────────────────────────────────────────────
export function usePrivy() {
  const auth = useAuthStore()
  const error = ref(null)

  // ── Google Sign-In ─────────────────────────────────────────────────────
  async function loginWithGoogle() {
    error.value = null
    if (!_privy) return _mockLogin('google', auth)
    auth._setLoading(true)
    try {
      const { url } = await _privy.auth.oauth.generateURL('google', _redirectUri())
      // Store that we started OAuth so completeOAuthCallback knows the provider
      sessionStorage.setItem('privy_oauth_provider', 'google')
      window.location.href = url
    } catch (e) {
      error.value = e.message
      auth._setLoading(false)
    }
  }

  // ── Called by AuthCallback.vue after Google redirects back ─────────────
  async function completeOAuthCallback(code, state) {
    error.value = null
    if (!_privy) {
      await _mockLogin('google', auth)
      return true
    }
    const provider = sessionStorage.getItem('privy_oauth_provider') ?? 'google'
    sessionStorage.removeItem('privy_oauth_provider')
    try {
      const result = await _privy.auth.oauth.loginWithCode(code, state, provider)
      // result is AuthenticatedUser: { user: User, token, ... }
      await _afterLogin(result.user, auth)
      return true
    } catch (e) {
      error.value = e.message
      auth._setLoading(false)
      return false
    }
  }

  // ── Email OTP ──────────────────────────────────────────────────────────
  async function loginWithEmail(email) {
    error.value = null
    if (!_privy) {
      // Mock mode: simulate OTP sent (don't authenticate yet)
      await new Promise((r) => setTimeout(r, 600))
      return { waitingOtp: true }
    }
    try {
      await _privy.auth.email.sendCode(email)
      return { waitingOtp: true }
    } catch (e) {
      error.value = e.message
    }
  }

  async function verifyEmailOtp(email, code) {
    error.value = null
    if (!_privy) return _mockLogin('email', auth)  // Mock: any code works
    auth._setLoading(true)
    try {
      const result = await _privy.auth.email.loginWithCode(email, code)
      // result is AuthenticatedUser: { user: User, token, ... }
      await _afterLogin(result.user, auth)
    } catch (e) {
      error.value = e.message
      auth._setLoading(false)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────
  async function logout() {
    if (_privy) {
      try { await _privy.auth.logout() } catch (_) {}
    }
    auth._onLogout()
    auth.setRole(null)
  }

  // ── Sign a message with the embedded wallet (for mutual agreements) ────
  async function signMessage(message) {
    if (!_privy || !auth.user) return _mockSignature(message)
    try {
      const { getUserEmbeddedEthereumWallet } = await import('@privy-io/js-sdk-core')
      const linked = getUserEmbeddedEthereumWallet(auth.user)
      if (!linked) return _mockSignature(message)
      const provider = await _privy.embeddedWallet.getProvider(linked)
      const accounts = await provider.request({ method: 'eth_requestAccounts' })
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, accounts[0]],
      })
      return signature
    } catch (e) {
      error.value = e.message
      return null
    }
  }

  return { loginWithGoogle, completeOAuthCallback, loginWithEmail, verifyEmailOtp, logout, signMessage, error }
}

// ── Post-login: ensure wallet exists, update store ────────────────────────────
async function _afterLogin(userData, auth) {
  try {
    const { getUserEmbeddedEthereumWallet } = await import('@privy-io/js-sdk-core')
    let linked = getUserEmbeddedEthereumWallet(userData)

    // Fallback: scan linkedAccounts directly (SDK field names vary by version)
    if (!linked) {
      const accs = userData.linked_accounts ?? userData.linkedAccounts ?? []
      // Privy embedded wallet: wallet_client_type === 'privy' && connector_type === 'embedded'
      const w = accs.find((a) =>
        a.wallet_client_type === 'privy' && a.connector_type === 'embedded'
      ) ?? accs.find((a) =>
        (a.type === 'wallet' || a.connector_type === 'embedded') &&
        (a.wallet_client_type === 'privy' || a.walletClientType === 'privy')
      )
      if (w?.address) linked = { address: w.address, chainType: 'ethereum', walletClientType: 'privy' }
    }

    // Privy embedded wallet proxy is not available in Capacitor WebView (no iframe).
    // Fall back to a local wallet persisted in localStorage, keyed to this Privy user.
    if (!linked) {
      const address = await _getOrCreateLocalWallet(userData.id)
      if (address) linked = { address, chainType: 'ethereum', walletClientType: 'local' }
    }

    auth._onAuthenticated(userData, linked ? { address: linked.address, chainType: 'ethereum', walletClientType: linked.walletClientType ?? 'privy' } : null)
  } catch (e) {
    console.error('[Privy] _afterLogin error:', e)
    auth._onAuthenticated(userData, null)
  }
}

// ── Local wallet fallback (Capacitor: no Privy iframe proxy available) ────────
// Generates a random private key once per Privy user ID, derives the address,
// and stores the key in localStorage. The key never leaves the device.
async function _getOrCreateLocalWallet(userId) {
  try {
    const storageKey = `kuluri_wallet_pk_${userId}`
    let pk = localStorage.getItem(storageKey)
    if (!pk) {
      const bytes = crypto.getRandomValues(new Uint8Array(32))
      pk = '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(storageKey, pk)
    }
    const { privateKeyToAccount } = await import('viem/accounts')
    return privateKeyToAccount(pk).address
  } catch (e) {
    console.warn('[Wallet] Local wallet generation failed:', e)
    return null
  }
}

// ── Mock helpers ─────────────────────────────────────────────────────────────
async function _mockLogin(provider, auth) {
  await new Promise((r) => setTimeout(r, 600))
  const mockUser = {
    id: 'mock-user-1',
    google: provider === 'google' ? { name: 'Demo User', email: 'demo@kuluri.eu', subject: 'mock' } : undefined,
    email: provider === 'email' ? { address: 'demo@kuluri.eu' } : undefined,
    linkedAccounts: [],
  }
  const mockWallet = { address: '0xDeMo0000000000000000000000000000000000FF', chainType: 'ethereum', walletClientType: 'privy' }
  auth._onAuthenticated(mockUser, mockWallet)
}

function _mockSignature(message) {
  const hex = [...message.slice(0, 32)].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  return '0x' + hex.padEnd(130, '0')
}
