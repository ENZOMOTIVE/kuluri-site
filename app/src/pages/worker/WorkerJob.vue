<script setup>
// One job, split into tabs so nothing is crowded: Details · Location · Agreement.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { Capacitor } from '@capacitor/core'
import FarmMap from '../../components/FarmMap.vue'
import AgreementView from '../../components/AgreementView.vue'
import { t, lang } from '../../data/i18n.js'
import { state, farm, fairRecord, fmtShort } from '../../data/store.js'
import { agreements, visibleToWorker } from '../../data/agreements.js'
import milano from '../../data/nuts/ITC4C.json' // Eurostat GISCO NUTS 2024, 1:10M, EPSG:4326

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const job = computed(() => state.jobs.find((j) => j.id === route.params.id))
const key = computed(() => `${route.params.id}:${state.me}`)
const invitation = computed(() => state.invitations[key.value])
const agreement = computed(() => agreements.find((a) => a.workerId === state.me && a.jobId === route.params.id && visibleToWorker(a)))

const tab = ref(route.query.tab || 'details')
watch(() => route.query.tab, (v) => { if (v) tab.value = v })

function respond(answer) {
  state.invitations[key.value] = answer
  if (answer === 'Accepted') $q.notify({ type: 'positive', message: t('accepted') })
}

// Location
const loc = farm.location
const housing = { lat: loc.lat + 0.004, lng: loc.lng + 0.005 } // ~600 m from the farmyard (demo)
function directions() {
  const url = Capacitor.getPlatform() === 'android'
    ? `geo:${loc.lat},${loc.lng}?q=${loc.lat},${loc.lng}(FARM-13079)`
    : `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
  window.open(url, '_blank')
}
</script>

<template>
  <q-page v-if="job" class="q-pa-md">
    <!-- Header -->
    <div class="row items-start no-wrap q-mb-sm">
      <q-btn flat dense round icon="arrow_back" class="q-mr-sm" @click="router.push('/worker/jobs')" />
      <div class="col">
        <div class="text-subtitle1 text-weight-bold">{{ job.title }}</div>
        <div class="text-caption text-muted">FARM-13079 · Milano (IT) · {{ fmtShort(job.start) }} – {{ fmtShort(job.end) }}</div>
      </div>
    </div>

    <q-tabs v-model="tab" dense no-caps align="justify" active-color="primary" indicator-color="primary" class="text-grey-7 card q-mb-md">
      <q-tab name="details" icon="o_info" :label="t('details')" />
      <q-tab name="location" icon="o_place" :label="t('location')" />
      <q-tab v-if="agreement" name="agreement" icon="o_handshake" :label="t('agreement')">
        <q-badge v-if="agreement.state === 'sent'" color="warning" floating rounded>1</q-badge>
      </q-tab>
    </q-tabs>

    <q-tab-panels v-model="tab" animated keep-alive class="bg-transparent">
      <!-- Details -->
      <q-tab-panel name="details" class="q-pa-none column q-gutter-y-md">
        <div class="card q-pa-md">
          <div class="row q-col-gutter-sm">
            <div class="col-6"><div class="card q-pa-sm bg-surface-2"><div class="text-h6 text-weight-bold">€{{ job.payPerHour.toFixed(2) }}</div><div class="text-caption text-muted">{{ t('perHour') }}</div></div></div>
            <div class="col-6"><div class="card q-pa-sm bg-surface-2"><div class="text-h6 text-weight-bold">{{ job.hoursPerWeek }}</div><div class="text-caption text-muted">{{ t('hoursWeek') }}</div></div></div>
          </div>
          <div class="row q-gutter-xs q-mt-sm">
            <q-chip v-if="job.housing" dense square class="bg-sage-soft text-primary" icon="o_home">{{ t('housing') }}</q-chip>
            <q-chip v-for="s in job.tasks" :key="s" dense square class="chip-soft">{{ s }}</q-chip>
            <q-chip v-for="l in job.languages" :key="l" dense square class="chip-soft" icon="o_translate">{{ l }}</q-chip>
          </div>
        </div>

        <div class="card q-pa-md">
          <div class="text-caption text-weight-bold"><q-icon name="verified" color="primary" class="q-mr-xs" />{{ t('fairRecord') }}</div>
          <div class="text-body2 q-mt-xs"><b>{{ fairRecord.confirmedShare }}%</b> {{ t('confirmedByWorkers') }} · <b>{{ fairRecord.writtenTerms }}%</b> {{ t('writtenTerms') }}</div>
        </div>

        <q-banner v-if="agreement" rounded class="bg-sage-soft cursor-pointer" @click="tab = 'agreement'">
          <template #avatar><q-icon name="o_handshake" color="primary" /></template>
          <span class="text-weight-bold">{{ agreement.state === 'sent' ? t('agreementReady') : t('st_Agreed') }}</span>
        </q-banner>

        <div v-if="invitation === 'Invited'" class="row q-gutter-sm">
          <q-btn unelevated color="primary" no-caps class="col" size="lg" :label="t('accept')" icon="check" @click="respond('Accepted')" />
          <q-btn outline color="grey-8" no-caps class="col" size="lg" :label="t('decline')" @click="respond('Declined')" />
        </div>
        <q-banner v-else-if="invitation && !agreement" rounded dense :class="invitation === 'Accepted' ? 'bg-sage-soft text-primary' : 'bg-surface-2 text-muted'">
          {{ invitation === 'Accepted' ? t('accepted') : t('declined') }}
        </q-banner>

        <q-btn outline color="primary" no-caps icon="o_chat_bubble_outline" :label="t('messageFarm')" to="/worker/chat" />
      </q-tab-panel>

      <!-- Location -->
      <q-tab-panel name="location" class="q-pa-none">
        <FarmMap v-if="tab === 'location'" :location="loc" :housing="housing" :region="milano" />
        <q-btn unelevated color="primary" no-caps icon="o_directions" :label="t('directions')" class="full-width q-mt-md" size="lg" @click="directions" />
        <div class="card q-pa-md q-mt-md">
          <div class="row items-center q-mb-sm"><q-icon name="agriculture" color="primary" size="20px" class="q-mr-sm" /><span class="text-weight-bold">{{ t('yard') }}</span></div>
          <div class="row items-center"><q-icon name="home" color="accent" size="20px" class="q-mr-sm" /><span class="text-weight-bold">{{ t('housingPin') }}</span><span class="text-caption text-muted q-ml-sm">~ 600 m</span></div>
        </div>
        <div class="text-caption text-muted q-mt-sm"><q-icon name="o_info" /> {{ t('approx') }}</div>
      </q-tab-panel>

      <!-- Agreement -->
      <q-tab-panel v-if="agreement" name="agreement" class="q-pa-none">
        <AgreementView :agreement="agreement" side="worker" :tr="t" :locale="lang" @change="router.push('/worker/chat')" />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>
