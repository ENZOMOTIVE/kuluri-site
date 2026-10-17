<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { t } from '../../data/i18n.js'
import { state, shortHash, fmtShort } from '../../data/store.js'
import { buildWorkHistoryPdf } from '../../utils/workHistoryPdf.js'
import { sharePdf } from '../../utils/share.js'

const $q = useQuasar()

const me = computed(() => state.workers.find((w) => w.id === state.me))
const verified = computed(() => me.value.history.filter((h) => h.confirmed))
const hours = computed(() => verified.value.reduce((a, h) => a + h.hours, 0))

// ---- Availability: the worker decides when farms can see them as available
const showAvail = ref(false)
const availDraft = ref({ looking: true, from: '', to: '' })
function openAvail() {
  availDraft.value = { looking: me.value.looking !== false, from: me.value.available[0], to: me.value.available[1] }
  showAvail.value = true
}
function saveAvail() {
  me.value.looking = availDraft.value.looking
  me.value.available = [availDraft.value.from, availDraft.value.to]
  showAvail.value = false
  $q.notify({ type: 'positive', message: t('availSaved') })
}

// ---- PDF export: the worker chooses which jobs to include
const allJobs = computed(() => [
  ...(state.week.status === 'Confirmed'
    ? [{ key: 'week', farm: state.week.farm, crop: state.week.crop, season: `2026 autumn (week ${state.week.weekNo})`, hours: state.week.days.reduce((a, d) => a + d.hours, 0), confirmed: true }]
    : []),
  ...me.value.history.map((h, i) => ({ key: `h${i}`, ...h })),
])
const showExport = ref(false)
const picked = ref([])
const includeHours = ref(true)
const busy = ref(false)
function openExport() {
  picked.value = allJobs.value.filter((j) => j.confirmed).map((j) => j.key)
  showExport.value = true
}
async function createPdf() {
  busy.value = true
  try {
    const jobs = allJobs.value.filter((j) => picked.value.includes(j.key))
    const doc = await buildWorkHistoryPdf({ worker: me.value, jobs, includeHours: includeHours.value })
    const res = await sharePdf(doc, `Kuluri_work_history_${me.value.id}.pdf`, `${me.value.name} – work history`)
    if (res !== 'cancelled') $q.notify({ type: 'positive', message: res === 'shared' ? t('pdfShared') : t('pdfDownloaded') })
    showExport.value = false
  } catch (e) {
    $q.notify({ type: 'negative', message: String(e?.message || e) })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-caption text-muted q-mb-sm"><q-icon name="o_info" /> {{ t('demo') }}</div>

    <div class="card q-pa-md q-mb-md">
      <div class="row items-center no-wrap">
        <q-avatar size="56px" class="bg-sage-soft text-primary text-weight-bold q-mr-md" font-size="20px">AP</q-avatar>
        <div>
          <div class="text-h6 text-weight-bold">{{ me.name }}</div>
          <div class="text-caption text-muted">{{ me.base }}</div>
        </div>
      </div>
      <div class="row q-col-gutter-sm q-mt-md text-center">
        <div class="col-6"><div class="card q-pa-sm bg-surface-2"><div class="text-h6 text-weight-bold">{{ verified.length }}</div><div class="text-caption text-muted">{{ t('verifiedJobs') }}</div></div></div>
        <div class="col-6"><div class="card q-pa-sm bg-surface-2"><div class="text-h6 text-weight-bold">{{ hours.toLocaleString('en') }}</div><div class="text-caption text-muted">{{ t('hours') }}</div></div></div>
      </div>
    </div>

    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2 text-weight-bold">{{ t('myHistory') }}</div>
      <q-space />
      <q-btn outline dense no-caps color="primary" icon="o_picture_as_pdf" :label="t('exportPdf')" class="q-px-sm" @click="openExport" />
    </div>
    <div class="card q-mb-md">
      <q-list separator>
        <q-item v-if="state.week.status === 'Confirmed'">
          <q-item-section avatar><q-icon name="verified" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ state.week.job }} · {{ state.week.label }}</q-item-label>
            <q-item-label caption>{{ state.week.farm }} · {{ state.week.days.reduce((a, d) => a + d.hours, 0) }} {{ t('hours') }} · <span class="mono">{{ shortHash(state.week.hash) }}</span></q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-for="(h, i) in me.history" :key="i">
          <q-item-section avatar><q-icon :name="h.confirmed ? 'verified' : 'o_hourglass_empty'" :color="h.confirmed ? 'primary' : 'grey-6'" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ h.crop }} · {{ h.season }}</q-item-label>
            <q-item-label caption>{{ h.farm }} · {{ h.hours }} {{ t('hours') }}</q-item-label>
            <q-item-label caption :class="h.confirmed ? 'verified' : ''">{{ h.confirmed ? t('confirmedBoth') : t('notConfirmed') }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div class="card q-pa-md q-mb-md">
      <div class="text-subtitle2 text-weight-bold">{{ t('skills') }}</div>
      <div class="row q-gutter-xs q-mt-xs q-mb-sm"><q-chip v-for="s in me.skills" :key="s" dense square class="bg-sage-soft text-primary">{{ s }}</q-chip></div>
      <div class="text-subtitle2 text-weight-bold">{{ t('languages') }}</div>
      <div class="row q-gutter-xs q-mt-xs q-mb-sm"><q-chip v-for="l in me.languages" :key="l" dense square class="chip-soft" icon="o_translate">{{ l }}</q-chip></div>
      <div class="row items-center">
        <div class="text-subtitle2 text-weight-bold">{{ t('available') }}</div>
        <q-space />
        <q-btn flat dense no-caps color="primary" icon="o_edit_calendar" :label="t('edit')" @click="openAvail" />
      </div>
      <div class="row items-center q-mt-xs">
        <q-badge :color="me.looking ? 'primary' : 'grey-6'" class="q-mr-sm">{{ me.looking ? t('lookingYes') : t('lookingNo') }}</q-badge>
        <span class="text-body2">{{ fmtShort(me.available[0]) }} – {{ fmtShort(me.available[1]) }}</span>
      </div>
    </div>

    <div class="card q-pa-md bg-surface-2">
      <div class="text-subtitle2 text-weight-bold"><q-icon name="o_shield" class="q-mr-xs" />{{ t('whoSees') }}</div>
      <div class="text-caption text-muted q-mt-xs">{{ t('whoSeesText') }}</div>
      <div class="text-caption text-muted q-mt-sm">{{ t('proofOwn') }}</div>
    </div>

    <q-dialog v-model="showAvail" position="bottom">
      <q-card style="width: 440px; max-width: 100vw" class="rounded">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">{{ t('available') }}</div>
          <div class="text-caption text-muted">{{ t('availNote') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none column q-gutter-md">
          <q-toggle v-model="availDraft.looking" :label="t('lookingYes')" color="primary" />
          <div class="row q-col-gutter-sm">
            <q-input class="col-6" outlined dense type="date" v-model="availDraft.from" :label="t('from')" stack-label :disable="!availDraft.looking" />
            <q-input class="col-6" outlined dense type="date" v-model="availDraft.to" :label="t('to')" stack-label :disable="!availDraft.looking" />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps :label="t('cancel')" v-close-popup />
          <q-btn unelevated no-caps color="primary" :label="t('save')" :disable="availDraft.looking && (!availDraft.from || !availDraft.to)" @click="saveAvail" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showExport" position="bottom">
      <q-card style="width: 440px; max-width: 100vw" class="rounded">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold">{{ t('choosePdf') }}</div>
          <div class="text-caption text-muted">{{ t('pdfNote') }}</div>
        </q-card-section>
        <q-list>
          <q-item v-for="j in allJobs" :key="j.key" tag="label" v-ripple>
            <q-item-section side><q-checkbox v-model="picked" :val="j.key" color="primary" /></q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ j.crop }} · {{ j.season }}</q-item-label>
              <q-item-label caption>{{ j.farm }} · {{ j.hours }} {{ t('hours') }} · <span :class="j.confirmed ? 'verified' : ''">{{ j.confirmed ? t('confirmedBoth') : t('notConfirmed') }}</span></q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-section class="q-pt-none">
          <q-toggle v-model="includeHours" :label="t('includeHours')" color="primary" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps :label="t('cancel')" v-close-popup />
          <q-btn unelevated no-caps color="primary" icon="o_ios_share" :label="t('createPdf')" :loading="busy" :disable="!picked.length" @click="createPdf" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
