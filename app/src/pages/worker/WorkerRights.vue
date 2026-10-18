<script setup>
// Rights & onboarding: a "before you go" checklist for the worker's next job, their rights in the EU,
// and where to get help – all in the worker's language.
import { QPage } from 'quasar'
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { lang, t } from '../../data/i18n.js'
import { state, fmtShort } from '../../data/store.js'
import { rights, CHECKLIST } from '../../data/rights.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

const $q = useQuasar()
const r = computed(() => rights[lang.value] ?? rights.en)
const job = computed(() => state.jobs.find((j) => state.invitations[`${j.id}:${state.me}`] === 'Accepted'))
const done = computed(() => CHECKLIST.filter((k) => state.onboarding[k]).length)

function report() {
  $q.dialog({ title: r.value.report, message: t('anonymous'), prompt: { model: '', type: 'textarea', outlined: true },
    cancel: { flat: true, noCaps: true, label: t('cancel') }, ok: { unelevated: true, noCaps: true, color: 'negative', label: t('sendReport') } })
    .onOk(() => $q.notify({ type: 'warning', message: t('reported') }))
}
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="q-pa-md">
    <div class="text-h6 text-weight-bold">{{ r.title }}</div>
    <div class="text-caption text-muted q-mb-md">{{ r.intro }}</div>

    <!-- Next job -->
    <div v-if="job" class="card q-pa-md q-mb-md">
      <div class="text-caption text-muted">{{ r.nextJob }}</div>
      <div class="text-weight-bold">{{ job.title }}</div>
      <div class="text-caption text-muted">FARM-13079 · {{ fmtShort(job.start) }} – {{ fmtShort(job.end) }}</div>
      <div class="row q-gutter-xs q-mt-xs">
        <q-chip dense square class="chip-soft">€{{ job.payPerHour.toFixed(2) }} {{ t('perHour') }}</q-chip>
        <q-chip dense square class="chip-soft">{{ job.hoursPerWeek }} {{ t('hoursWeek') }}</q-chip>
        <q-chip v-if="job.housing" dense square class="bg-sage-soft text-primary" icon="o_home">{{ t('housing') }}</q-chip>
      </div>
      <div class="row q-gutter-sm q-mt-sm">
        <q-btn outline dense no-caps color="primary" icon="o_work_outline" :label="r.openJob" class="q-px-sm" :to="`/worker/job/${job.id}`" />
        <q-btn flat dense no-caps color="primary" icon="o_chat_bubble_outline" :label="r.askFarm" to="/worker/chat" />
      </div>
    </div>

    <!-- Checklist -->
    <div class="card q-mb-md">
      <div class="row items-center q-px-md q-pt-md">
        <div class="text-subtitle2 text-weight-bold">{{ r.title }}</div>
        <q-space />
        <span class="text-caption text-muted">{{ r.progress.replace('{d}', done).replace('{n}', CHECKLIST.length) }}</span>
      </div>
      <q-linear-progress :value="done / CHECKLIST.length" color="primary" track-color="grey-3" rounded class="q-mx-md q-mt-sm" style="width: auto" />
      <q-list>
        <q-item v-for="k in CHECKLIST" :key="k" tag="label" v-ripple>
          <q-item-section side top><q-checkbox v-model="state.onboarding[k]" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium" :class="{ 'text-muted': state.onboarding[k] }">{{ r.check[k][0] }}</q-item-label>
            <q-item-label caption>{{ r.check[k][1] }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Rights -->
    <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ r.rightsTitle }}</div>
    <div class="card q-mb-md">
      <q-list separator>
        <q-item v-for="[icon, title, text] in r.rights" :key="title">
          <q-item-section avatar><q-avatar rounded size="36px" class="bg-sage-soft text-primary" :icon="icon" font-size="20px" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ title }}</q-item-label>
            <q-item-label caption>{{ text }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Help -->
    <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ r.helpTitle }}</div>
    <div class="card q-mb-md">
      <q-list separator>
        <q-item v-for="[icon, title, text] in r.help" :key="title">
          <q-item-section avatar><q-icon :name="icon" color="primary" size="22px" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ title }}</q-item-label>
            <q-item-label caption>{{ text }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <div class="q-pa-md q-pt-none">
        <q-btn outline color="negative" no-caps icon="o_flag" :label="r.report" class="full-width" @click="report" />
      </div>
    </div>

    <div class="text-caption text-muted"><q-icon name="o_info" class="q-mr-xs" />{{ r.note }}</div>
  </component>
</template>
