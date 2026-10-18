<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { usePrivy } from '../../composables/usePrivy.js'
import { useAuthStore } from '../../stores/auth.js'
import { farm } from '../../data/store.js'

const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()
const { logout } = usePrivy()

const name = computed(() => {
  const d = auth.displayName ?? ''
  if (!d) return farm.id
  if (d.includes('@')) return d.split('@')[0]
  return d
})
const email = computed(() => {
  const u = auth.user
  if (!u) return ''
  if (u.email?.address) return u.email.address
  if (u.google?.email) return u.google.email
  const linked = u.linked_accounts ?? u.linkedAccounts ?? []
  return linked.find((a) => a.type === 'email')?.address ?? linked.find((a) => a.type === 'google_oauth')?.email ?? ''
})

async function doLogout() {
  await logout()
  router.push('/login')
}

function copyWallet() {
  if (!auth.walletAddress) return
  $q.copyToClipboard(auth.walletAddress)
    .then(() => $q.notify({ message: 'Address copied', icon: 'o_copy', timeout: 1500 }))
}
</script>

<template>
  <q-page class="pf-page">
    <div class="pf-wrap">

    <!-- Header -->
    <div class="pf-header">
      <div class="pf-avatar">
        <q-avatar rounded size="56px" style="background: #163300; color: #9FE870; font-size: 22px; font-weight: 700;">FA</q-avatar>
      </div>
      <div class="pf-name">{{ name }}</div>
      <div class="pf-email">{{ email }}</div>
      <div class="pf-role">Farm employer</div>
    </div>

    <!-- Farm group -->
    <div class="pf-group-label">Farm</div>
    <div class="pf-group">
      <div class="pf-row">
        <div class="pf-row-label">Farm ID</div>
        <div class="pf-row-value pf-row-value--muted">{{ farm.id }}</div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row">
        <div class="pf-row-label">Region</div>
        <div class="pf-row-value pf-row-value--muted">{{ farm.region }}</div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row">
        <div class="pf-row-label">Crops</div>
        <div class="pf-row-value pf-row-value--muted">{{ farm.crops?.join(', ') ?? '—' }}</div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="router.push('/farm/settings')">
        <div class="pf-row-label">Farm details</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
    </div>

    <!-- Account group -->
    <div class="pf-group-label">Account</div>
    <div class="pf-group">
      <div class="pf-row pf-row--stacked">
        <div class="pf-row-label">Email</div>
        <div class="pf-stacked-value">{{ email || '—' }}</div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="router.push('/setup')">
        <div class="pf-row-label">Account type</div>
        <div class="pf-row-value pf-row-value--link">Farm employer <q-icon name="chevron_right" size="14px" color="grey-5" /></div>
      </div>
    </div>

    <!-- Wallet group -->
    <div class="pf-group-label">Wallet</div>
    <div class="pf-group">
      <div class="pf-row pf-row--tap" @click="copyWallet">
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
      <div class="pf-row pf-row--tap" @click="router.push('/farm/settings?tab=privacy')">
        <div class="pf-row-label">Privacy &amp; sharing</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="router.push('/farm/impact')">
        <div class="pf-row-label">Impact report</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
    </div>

    <!-- Switch role -->
    <div class="pf-group pf-group--mt">
      <div class="pf-row pf-row--tap" @click="auth.setRole('worker'); router.replace('/worker')">
        <div class="pf-row-label">Switch to Worker view</div>
        <q-icon name="o_badge" size="18px" color="grey-5" />
      </div>
    </div>

    <!-- Sign out -->
    <div class="pf-group pf-group--mt">
      <div class="pf-row pf-row--tap" @click="doLogout">
        <div class="pf-row-label pf-row-label--danger">Sign out</div>
      </div>
    </div>

    <div class="pf-version">Kuluri · v0.1</div>
    </div><!-- pf-wrap -->
  </q-page>
</template>

<style scoped>
.pf-page {
  background: #f2f2f7;
  min-height: 100%;
}
.pf-wrap {
  max-width: 560px;
  margin: 0 auto;
}
.pf-header {
  padding: 28px 20px 20px;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.pf-avatar { margin-bottom: 12px; }
.pf-name {
  font-size: 20px;
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
  color: #163300;
  background: #d4f0b0;
  border-radius: 6px;
  padding: 2px 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pf-group-label {
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 18px 20px 6px;
}
.pf-group {
  background: #fff;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
}
.pf-group--mt { margin-top: 16px; }
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
.pf-row--tap:active { background: #f0f0f0; }
.pf-sep {
  height: 0.5px;
  background: #e5e5ea;
  margin-left: 16px;
}
.pf-row-label { font-size: 15px; color: #111; }
.pf-row-label--danger { color: #ff3b30; }
.pf-row-value { font-size: 14px; color: #8e8e93; text-align: right; max-width: 60%; }
.pf-row-value--muted { color: #bbb; font-style: italic; font-size: 13px; }
.pf-row-value--link { display: flex; align-items: center; gap: 2px; color: #8e8e93; }
.pf-row--stacked { flex-direction: column; align-items: flex-start; gap: 2px; padding-bottom: 13px; }
.pf-stacked-value { font-size: 14px; color: #8e8e93; word-break: break-all; line-height: 1.4; }
.pf-wallet-short {
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 13px;
  color: #8e8e93;
  margin-right: 4px;
}
.pf-version {
  text-align: center;
  font-size: 13px;
  color: #bbb;
  padding: 28px 0 40px;
}
</style>
