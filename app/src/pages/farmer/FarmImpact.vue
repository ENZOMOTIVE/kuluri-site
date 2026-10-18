<script setup>
// Social impact: anonymous indicators grouped by the ESF+ specific objectives they support.
// For funding applications and reporting (e.g. to an ESF+ managing authority or a regional partner).
import { QPage } from 'quasar'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { impact, impactCsv } from '../../data/impact.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

function download() {
  const blob = new Blob([impactCsv(impact.value)], { type: 'text/csv;charset=utf-8' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'Kuluri_impact_ESF+.csv' })
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Impact report</h1>
        <div class="text-muted q-mt-xs">What Kuluri changes for seasonal workers, grouped by the objectives of the European Social Fund Plus (ESF+). Anonymous figures only.</div>
      </div>
      <q-btn unelevated color="primary" icon="o_file_download" label="Export indicators (CSV)" no-caps @click="download" />
    </div>
    <SimulatedNote text="Indicators are computed from simulated workers and jobs in this prototype. In the product they come from confirmed records, aggregated so no single worker can be identified." />

    <div class="row q-col-gutter-lg">
      <div v-for="g in impact" :key="g.key" class="col-12 col-md-6">
        <div class="card q-pa-md full-height">
          <div class="row items-center no-wrap q-mb-sm">
            <q-avatar rounded size="40px" class="bg-sage-soft text-primary q-mr-md" :icon="g.icon" />
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">{{ g.title }}</div>
              <div class="text-caption text-muted">ESF+ objective {{ g.objective }}</div>
            </div>
          </div>
          <div class="text-body2 text-muted q-mb-md">{{ g.text }}</div>
          <div class="row q-col-gutter-sm">
            <div v-for="[k, v] in g.kpis" :key="k" class="col-4">
              <div class="card q-pa-sm bg-surface-2 full-height">
                <div class="text-h6 text-weight-bold">{{ v }}</div>
                <div class="text-caption text-muted">{{ k }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-caption text-muted q-mt-lg"><q-icon name="o_info" class="q-mr-xs" />Objectives refer to Regulation (EU) 2021/1057 (ESF+), Art. 4(1). Funding goes to projects through national or regional ESF+ programmes; eligibility is decided by the managing authority.</div>
  </component>
</template>
