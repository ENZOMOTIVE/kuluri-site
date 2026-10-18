<script setup>
import { computed, ref, onMounted } from 'vue'
import { usePrivy } from '../../composables/usePrivy.js'
import { useAuthStore } from '../../stores/auth.js'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { SKILLS, LANGS } from '../../data/store.js'
import { userService } from '../../services/user.service.js'

const auth = useAuthStore()
const router = useRouter()
const { logout } = usePrivy()
const $q = useQuasar()

const mySkills = ref([])
const myLanguages = ref([])
const myAvailStart = ref('')
const myAvailEnd = ref('')
const saving = ref(false)

onMounted(async () => {
  if (!auth.user?.id) return
  const p = await userService.getWorkerProfile(auth.user.id).catch(() => null)
  if (p) {
    mySkills.value = p.skills ?? []
    myLanguages.value = p.languages ?? []
    myAvailStart.value = p.availability_start ?? ''
    myAvailEnd.value = p.availability_end ?? ''
    if (p.location_country && !auth.location) auth.setLocation({ country: p.location_country })
  }
})

async function saveProfile() {
  if (!auth.user?.id) return
  saving.value = true
  try {
    await userService.updateWorkerProfile(auth.user.id, {
      skills: mySkills.value,
      languages: myLanguages.value,
      availabilityStart: myAvailStart.value || null,
      availabilityEnd: myAvailEnd.value || null,
      locationCountry: auth.location?.country ?? null,
    })
    $q.notify({ type: 'positive', icon: 'check', message: 'Profile saved — farms can now find you', timeout: 2000 })
  } catch {
    $q.notify({ type: 'negative', message: 'Save failed, try again' })
  } finally {
    saving.value = false }
}

function editSkills() {
  const draft = ref([...mySkills.value])
  $q.dialog({
    component: { template: '<span/>' }, // use message slot via custom approach
    title: 'Your skills',
    message: 'Select everything you can do on a farm.',
    options: {
      type: 'checkbox',
      model: mySkills.value,
      items: SKILLS.map((s) => ({ label: s, value: s })),
    },
    cancel: { flat: true, noCaps: true, label: 'Cancel' },
    ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Save' },
  }).onOk((val) => { mySkills.value = val })
}

function editLanguages() {
  $q.dialog({
    title: 'Languages',
    message: 'Which languages can you work in?',
    options: {
      type: 'checkbox',
      model: myLanguages.value,
      items: LANGS.map((l) => ({ label: l, value: l })),
    },
    cancel: { flat: true, noCaps: true, label: 'Cancel' },
    ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Save' },
  }).onOk((val) => { myLanguages.value = val })
}

function editAvailability() {
  const startDraft = ref(myAvailStart.value)
  const endDraft = ref(myAvailEnd.value)
  $q.dialog({
    title: 'Your availability',
    message: 'When can you work? Set the period you are free to take a job.',
    html: false,
    cancel: { flat: true, noCaps: true, label: 'Cancel' },
    ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Save' },
    prompt: { model: myAvailStart.value, type: 'date', label: 'Available from' },
  }).onOk((val) => {
    myAvailStart.value = val
    // Then ask end date
    $q.dialog({
      title: 'Available until',
      cancel: { flat: true, noCaps: true, label: 'Cancel' },
      ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Save' },
      prompt: { model: myAvailEnd.value, type: 'date', label: 'Available until' },
    }).onOk((v) => { myAvailEnd.value = v })
  })
}

function editLocation() {
  const EU_COUNTRIES = [
    'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark',
    'Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy',
    'Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland','Portugal',
    'Romania','Slovakia','Slovenia','Spain','Sweden','India','Ukraine','Moldova',
  ]
  $q.dialog({
    title: 'Your base location',
    message: 'Where are you based?',
    options: {
      type: 'radio',
      model: auth.location?.country ?? '',
      items: EU_COUNTRIES.map((c) => ({ label: c, value: c })),
    },
    cancel: { flat: true, noCaps: true, label: 'Cancel' },
    ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Save' },
  }).onOk((country) => { if (country) auth.setLocation({ country }) })
}

const email = computed(() => {
  const u = auth.user
  if (!u) return ''
  if (u.email?.address) return u.email.address
  if (u.google?.email) return u.google.email
  const linked = u.linked_accounts ?? u.linkedAccounts ?? []
  return linked.find((a) => a.type === 'email')?.address ?? linked.find((a) => a.type === 'google_oauth')?.email ?? ''
})
const name = computed(() => {
  const d = auth.displayName ?? ''
  if (!d) return 'Account'
  return d.includes('@') ? d.split('@')[0] : d.split(' ')[0]
})
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const profileComplete = computed(() => mySkills.value.length > 0 && myAvailStart.value && myAvailEnd.value)

async function doLogout() { await logout(); router.push('/login') }
</script>

<template>
  <q-page class="pf-page">

    <div class="pf-header">
      <div class="pf-name">{{ name }}</div>
      <div class="pf-email">{{ email }}</div>
      <div class="pf-role">Seasonal worker</div>
    </div>

    <!-- Worker profile — what farms see -->
    <div class="pf-group-label">
      Worker profile
      <span v-if="!profileComplete" class="pf-warn">· incomplete</span>
    </div>
    <div class="pf-group">
      <div class="pf-row pf-row--tap" @click="editSkills">
        <div class="pf-row-label">Skills</div>
        <div class="pf-row-value pf-row-value--link">
          <span>{{ mySkills.length ? mySkills.slice(0,2).join(', ') + (mySkills.length > 2 ? ` +${mySkills.length - 2}` : '') : 'Not set' }}</span>
          <q-icon name="chevron_right" size="14px" color="grey-5" />
        </div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="editLanguages">
        <div class="pf-row-label">Languages</div>
        <div class="pf-row-value pf-row-value--link">
          <span>{{ myLanguages.length ? myLanguages.join(', ') : 'Not set' }}</span>
          <q-icon name="chevron_right" size="14px" color="grey-5" />
        </div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="editAvailability">
        <div class="pf-row-label">Availability</div>
        <div class="pf-row-value pf-row-value--link">
          <span>{{ myAvailStart && myAvailEnd ? fmtDate(myAvailStart) + ' – ' + fmtDate(myAvailEnd) : 'Not set' }}</span>
          <q-icon name="chevron_right" size="14px" color="grey-5" />
        </div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="editLocation">
        <div class="pf-row-label">Base location</div>
        <div class="pf-row-value pf-row-value--link">
          {{ auth.location?.country ?? 'Not set' }}
          <q-icon name="chevron_right" size="14px" color="grey-5" />
        </div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row">
        <q-btn unelevated no-caps color="primary" label="Save profile" icon="check" size="sm" :loading="saving" @click="saveProfile" />
        <div v-if="profileComplete" class="pf-row-value" style="font-size:12px;color:#34c759">Visible to farms ✓</div>
      </div>
    </div>

    <!-- Account -->
    <div class="pf-group-label">Account</div>
    <div class="pf-group">
      <div class="pf-row pf-row--stacked">
        <div class="pf-row-label">Email</div>
        <div class="pf-stacked-value">{{ email || '—' }}</div>
      </div>
      <div class="pf-sep" />
      <div class="pf-row pf-row--tap" @click="router.push('/worker/history')">
        <div class="pf-row-label">Work history</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
    </div>

    <!-- Wallet -->
    <div class="pf-group-label">Wallet</div>
    <div class="pf-group">
      <div class="pf-row pf-row--tap" @click="auth.walletAddress && $q.copyToClipboard(auth.walletAddress).then(() => $q.notify({ message: 'Address copied', icon: 'o_copy', timeout: 1500 }))">
        <div class="pf-row-label">Wallet</div>
        <div class="pf-row-value pf-row-value--link" v-if="auth.walletAddress">
          <span class="pf-wallet-short">{{ auth.shortAddress }}</span>
          <q-icon name="o_copy" size="13px" color="grey-5" />
        </div>
        <div class="pf-row-value pf-row-value--muted" v-else>Setting up…</div>
      </div>
    </div>

    <!-- Settings -->
    <div class="pf-group-label">Settings</div>
    <div class="pf-group">
      <div class="pf-row pf-row--tap" @click="router.push('/worker/rights')">
        <div class="pf-row-label">Your rights &amp; support</div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>
    </div>

    <div class="pf-group pf-group--mt">
      <div class="pf-row pf-row--tap" @click="auth.setRole('farmer'); router.replace('/farm')">
        <div class="pf-row-label">Switch to Farm view</div>
        <q-icon name="o_agriculture" size="18px" color="grey-5" />
      </div>
    </div>

    <div class="pf-group pf-group--mt">
      <div class="pf-row pf-row--tap" @click="doLogout">
        <div class="pf-row-label pf-row-label--danger">Sign out</div>
      </div>
    </div>

    <div class="pf-version">Kuluri · v0.1</div>
  </q-page>
</template>

<style scoped>
.pf-page { background: #f2f2f7; min-height: 100%; }
.pf-header { padding: 32px 20px 20px; }
.pf-name { font-size: 22px; font-weight: 700; color: #111; letter-spacing: -0.02em; margin-bottom: 3px; }
.pf-email { font-size: 14px; color: #666; margin-bottom: 6px; }
.pf-role { display: inline-block; font-size: 11px; font-weight: 600; color: #555; background: #e0e0e0; border-radius: 6px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.04em; }
.pf-warn { font-size: 11px; color: #ff9500; font-weight: 600; text-transform: none; letter-spacing: 0; }
.pf-group-label { font-size: 13px; font-weight: 600; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.05em; padding: 18px 20px 6px; }
.pf-group { background: #fff; border-radius: 12px; margin: 0 16px; overflow: hidden; }
.pf-group--mt { margin-top: 16px; }
.pf-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; min-height: 44px; }
.pf-row--tap { cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: rgba(0,0,0,0.04); }
.pf-row--tap:active { background: #f0f0f0; }
.pf-sep { height: 0.5px; background: #e5e5ea; margin-left: 16px; }
.pf-row-label { font-size: 15px; color: #111; }
.pf-row-label--danger { color: #ff3b30; }
.pf-row-value { font-size: 13px; color: #8e8e93; text-align: right; max-width: 60%; }
.pf-row-value--muted { color: #bbb; font-style: italic; font-size: 13px; }
.pf-row-value--link { display: flex; align-items: center; gap: 4px; color: #8e8e93; }
.pf-row--stacked { flex-direction: column; align-items: flex-start; gap: 2px; padding-bottom: 13px; }
.pf-stacked-value { font-size: 14px; color: #8e8e93; word-break: break-all; }
.pf-wallet-short { font-family: 'SF Mono', 'Courier New', monospace; font-size: 13px; color: #8e8e93; margin-right: 4px; }
.pf-version { text-align: center; font-size: 13px; color: #bbb; padding: 28px 0 40px; }
</style>
