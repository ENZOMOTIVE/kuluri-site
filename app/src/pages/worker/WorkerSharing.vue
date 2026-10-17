<script setup>
// The worker decides what farms see. Every change applies right away to what farms see in Find workers
// and the season planner (see farmView in store.js).
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../../data/i18n.js'
import { state, inContact } from '../../data/store.js'

const router = useRouter()
const me = computed(() => state.workers.find((w) => w.id === state.me))
const s = computed(() => me.value.share)

// Farms that can see the profile right now
const contactFarms = computed(() => (inContact(me.value) ? ['FARM-13079'] : []))
const seenBy = computed(() => {
  const who = s.value.audience === 'region' ? [t('seenRegion')] : contactFarms.value
  return t('seenBy').replace('{x}', who.length ? who.join(', ') : t('seenNobody'))
})

function toggleJob(i, on) {
  const h = s.value.hidden
  if (on) h.splice(h.indexOf(i), 1)
  else if (!h.includes(i)) h.push(i)
}

const rows = [
  ['hours', 'o_schedule', 'sh_hours'],
  ['skills', 'o_school', 'sh_skills'],
  ['languages', 'o_translate', 'sh_languages'],
  ['availability', 'o_event_available', 'sh_availability'],
]
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center no-wrap q-mb-xs">
      <q-btn flat dense round icon="arrow_back" class="q-mr-sm" @click="router.push('/worker/profile')" />
      <div class="text-h6 text-weight-bold">{{ t('mySharing') }}</div>
    </div>
    <div class="text-caption text-muted q-mb-md">{{ t('sharingIntro') }}</div>

    <!-- Who can find me -->
    <div class="card q-pa-md q-mb-md">
      <div class="text-subtitle2 text-weight-bold">{{ t('whoCanFind') }}</div>
      <q-option-group v-model="s.audience" color="primary" class="q-mt-xs"
        :options="[{ label: t('aud_region'), value: 'region' }, { label: t('aud_applied'), value: 'applied' }]" />
      <div class="text-caption text-muted q-mt-xs"><q-icon name="o_visibility" class="q-mr-xs" />{{ seenBy }}</div>
    </div>

    <!-- Work history, job by job -->
    <div class="card q-mb-md">
      <q-item tag="label" class="q-pt-md">
        <q-item-section avatar><q-icon name="o_history" color="primary" /></q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ t('sh_history') }}</q-item-label>
          <q-item-label caption>{{ t('sh_historyNote') }}</q-item-label>
        </q-item-section>
        <q-item-section side><q-toggle v-model="s.history" color="primary" /></q-item-section>
      </q-item>
      <q-list v-if="s.history" dense class="q-pb-sm">
        <q-item v-for="(h, i) in me.history" :key="i" tag="label" class="q-pl-xl">
          <q-item-section>
            <q-item-label>{{ h.crop }} · {{ h.season }}</q-item-label>
            <q-item-label caption>{{ h.farm }}</q-item-label>
          </q-item-section>
          <q-item-section side><q-checkbox :model-value="!s.hidden.includes(i)" color="primary" @update:model-value="(v) => toggleJob(i, v)" /></q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Other items -->
    <div class="card q-mb-md">
      <q-list separator>
        <q-item v-for="[key, icon, label] in rows" :key="key" tag="label">
          <q-item-section avatar><q-icon :name="icon" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ t(label) }}</q-item-label>
            <q-item-label caption>{{ s[key] ? seenBy : t('sh_hidden') }}</q-item-label>
          </q-item-section>
          <q-item-section side><q-toggle v-model="s[key]" color="primary" /></q-item-section>
        </q-item>
      </q-list>
    </div>

    <div class="card q-pa-md bg-surface-2">
      <div class="text-caption text-muted"><q-icon name="o_lock" class="q-mr-xs" />{{ t('alwaysPrivate') }}</div>
      <div class="text-caption text-muted q-mt-xs">{{ t('proofOwn') }}</div>
    </div>
  </q-page>
</template>
