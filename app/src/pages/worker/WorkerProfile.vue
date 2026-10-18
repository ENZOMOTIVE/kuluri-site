<script setup>
import { computed } from 'vue'
import { usePrivy } from '../../composables/usePrivy.js'
import { useAuthStore } from '../../stores/auth.js'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const { logout } = usePrivy()
import { useQuasar } from 'quasar'
const $quasar = useQuasar()

const EU_COUNTRIES = [
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark',
  'Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy',
  'Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland','Portugal',
  'Romania','Slovakia','Slovenia','Spain','Sweden','India','Ukraine','Moldova',
]

function editLocation() {
  $quasar.dialog({
    title: 'Your base location',
    message: 'Where are you based? This helps farms find workers near them.',
    options: {
      type: 'radio',
      model: auth.location?.country ?? '',
      items: EU_COUNTRIES.map((c) => ({ label: c, value: c })),
    },
    cancel: { flat: true, noCaps: true, label: 'Cancel' },
    ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Save' },
  }).onOk((country) => {
    if (country) auth.setLocation({ country })
  })
}

// Extract email from any linked account structure Privy may return
const email = computed(() => {
  const u = auth.user
  if (!u) return ''
  // Direct email link
  if (u.email?.address) return u.email.address
  // Google OAuth
  if (u.google?.email) return u.google.email
  // Privy linked_accounts array (some SDK versions)
  const linked = u.linked_accounts ?? u.linkedAccounts ?? []
  const emailAcc = linked.find((a) => a.type === 'email')
  if (emailAcc?.address) return emailAcc.address
  const googleAcc = linked.find((a) => a.type === 'google_oauth')
  if (googleAcc?.email) return googleAcc.email
  return ''
})
const name = computed(() => {
  const d = auth.displayName ?? ''
  if (!d) return 'Account'
  if (d.includes('@')) return d.split('@')[0]
  return d
})
const roleLabel = computed(() =>
  auth.role === 'farmer' ? 'Farm employer' : 'Seasonal worker'
)

async function doLogout() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <q-page class="pf-page">

    <!-- Name + email header -->
    <div class="pf-header">
      <div class="pf-name">{{ name }}</div>
      <div class="pf-email">{{ email }}</div>
      <div class="pf-role">{{ roleLabel }}</div>
    </div>

    <!-- Account group -->
    <div class="pf-group-label">Account</div>
    <div class="pf-group">
      <div class="pf-row pf-row--stacked">
        <div class="pf-row-label">Email</div>
        <div class="pf-stacked-value">{{ email || '—' }}</div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="editLocation">
        <div class="pf-row-label">Location</div>
        <div class="pf-row-value pf-row-value--link">
          {{ auth.location?.country ?? 'Not set' }}
          <q-icon name="chevron_right" size="14px" color="grey-5" />
        </div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="router.push('/setup')">
        <div class="pf-row-label">Account type</div>
        <div class="pf-row-value pf-row-value--link">{{ roleLabel }} <q-icon name="chevron_right" size="14px" color="grey-5" /></div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="router.push('/worker/history')">
        <div class="pf-row-label">History</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
    </div>

    <!-- Wallet group -->
    <div class="pf-group-label">Wallet</div>
    <div class="pf-group">
      <div class="pf-row pf-row--tap" @click="auth.walletAddress && $quasar.copyToClipboard(auth.walletAddress) && $quasar.notify({ message: 'Address copied', icon: 'o_copy', timeout: 1500 })">
        <div class="pf-row-label">Wallet</div>
        <div class="pf-row-value pf-row-value--link" v-if="auth.walletAddress">
          <span class="pf-wallet-short">{{ auth.shortAddress }}</span>
          <q-icon name="o_copy" size="13px" color="grey-5" />
        </div>
        <div class="pf-row-value pf-row-value--muted" v-else>Setting up…</div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row">
        <div class="pf-row-label">Custody</div>
        <div class="pf-row-value pf-row-value--muted">{{ auth.wallet?.walletClientType === 'local' ? 'This device only' : 'Privy embedded' }}</div>
      </div>
    </div>

    <!-- Settings group -->
    <div class="pf-group-label">Settings</div>
    <div class="pf-group">
      <div class="pf-row pf-row--tap" @click="router.push('/worker/sharing')">
        <div class="pf-row-label">Privacy &amp; sharing</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="router.push('/worker/rights')">
        <div class="pf-row-label">Your rights &amp; support</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
    </div>

    <!-- Switch role -->
    <div class="pf-group pf-group--mt">
      <div class="pf-row pf-row--tap" @click="auth.setRole('farmer'); router.replace('/farm')">
        <div class="pf-row-label">Switch to Farm view</div>
        <q-icon name="o_agriculture" size="18px" color="grey-5" />
      </div>
    </div>

    <!-- Sign out -->
    <div class="pf-group pf-group--mt">
      <div class="pf-row pf-row--tap" @click="doLogout">
        <div class="pf-row-label pf-row-label--danger">Sign out</div>
      </div>
    </div>

    <div class="pf-version">Kuluri · v0.1</div>

  </q-page>
</template>

<style scoped>
.pf-page {
  background: #f2f2f7;
  min-height: 100%;
}

/* Header */
.pf-header {
  padding: 32px 20px 24px;
  background: #f2f2f7;
}
.pf-name {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.02em;
  margin-bottom: 3px;
}
.pf-email {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
}
.pf-role {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  background: #e0e0e0;
  border-radius: 6px;
  padding: 2px 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Group label */
.pf-group-label {
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 18px 20px 6px;
}

/* Group card */
.pf-group {
  background: #fff;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
}
.pf-group--mt {
  margin-top: 16px;
}

/* Row */
.pf-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  min-height: 44px;
}
.pf-row--tap {
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(0,0,0,0.04);
}
.pf-row--tap:active {
  background: #f0f0f0;
}

.pf-sep {
  height: 0.5px;
  background: #e5e5ea;
  margin-left: 16px;
}

.pf-row-label {
  font-size: 15px;
  color: #111;
}
.pf-row-label--danger {
  color: #ff3b30;
}

.pf-row-value {
  font-size: 14px;
  color: #8e8e93;
  text-align: right;
  max-width: 60%;
}
.pf-row-value--muted {
  color: #bbb;
  font-style: italic;
  font-size: 13px;
}
.pf-row-value--link {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #8e8e93;
}
.pf-row--stacked {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding-bottom: 13px;
}
.pf-stacked-value {
  font-size: 14px;
  color: var(--muted);
  word-break: break-all;
  line-height: 1.4;
}
.pf-wallet-short {
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 13px;
  color: var(--muted);
  margin-right: 4px;
}

.pf-version {
  text-align: center;
  font-size: 13px;
  color: #bbb;
  padding: 28px 0 40px;
}
</style>
