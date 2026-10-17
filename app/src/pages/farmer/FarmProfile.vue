<script setup>
import KpiCard from '../../components/KpiCard.vue'
import { farm, cropName, fmtDate } from '../../data/store.js'

const cropAreas = Object.entries(
  farm.parcels.reduce((a, p) => ({ ...a, [p.crop]: (a[p.crop] || 0) + p.area_ha }), {}),
).sort((a, b) => b[1] - a[1])

const cols = [
  { name: 'year', label: 'Season', field: 'year', align: 'left' },
  { name: 'n', label: 'N kg/ha', field: 'n_kg_ha', align: 'right' },
  { name: 'nm', label: 'Mineral', field: 'n_mineral_kg_ha', align: 'right' },
  { name: 'no', label: 'Organic', field: 'n_organic_kg_ha', align: 'right' },
  { name: 'pp', label: 'Plant protection apps', field: 'pp_applications', align: 'right' },
  { name: 'h', label: 'Harvest (t)', field: (r) => r.harvest_t.toLocaleString('en'), align: 'right' },
  { name: 'i', label: 'Irrigation (m³)', field: (r) => r.irrigation_m3.toLocaleString('en'), align: 'right' },
]
</script>

<template>
  <q-page class="page">
    <div class="page-header">
      <h1 class="page-title">Farm data</h1>
      <div class="text-muted q-mt-xs">Real records of {{ farm.id }} from the organisers’ synthetic dataset. Used to answer buyers.</div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3"><KpiCard label="Holding" :value="farm.id" :sub="farm.region" icon="o_agriculture" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Area" :value="`${farm.areaHa} ha`" :sub="`${farm.parcels.length} parcels`" icon="o_square_foot" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Certificate" :value="farm.certificate.scheme === 'ORGANIC' ? 'Organic' : farm.certificate.scheme" :sub="`until ${fmtDate(farm.certificate.to)}`" icon="o_workspace_premium" /></div>
      <div class="col-6 col-md-3"><KpiCard label="People working" :value="farm.regularWorkers.length + farm.familyWorkers.length" :sub="`${farm.regularWorkers.length} paid regular · ${farm.familyWorkers.length} family`" icon="o_groups" /></div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-4">
        <div class="card q-pa-md">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Crops by area</div>
          <div v-for="[c, a] in cropAreas" :key="c" class="q-mb-sm">
            <div class="row justify-between text-body2"><span>{{ cropName(c) }}</span><span class="text-muted">{{ a.toFixed(1) }} ha</span></div>
            <q-linear-progress :value="a / farm.areaHa" rounded size="8px" color="primary" track-color="grey-3" />
          </div>
          <div class="mono text-muted q-mt-md">synthetic_parcel</div>
        </div>
      </div>
      <div class="col-12 col-md-8">
        <q-table flat bordered class="rounded" title="Inputs and harvest per season" :rows="[...farm.yearly].reverse()" :columns="cols" row-key="year" :pagination="{ rowsPerPage: 0 }" hide-bottom dense />
        <div class="mono text-muted q-mt-sm">synthetic_fertilisation · synthetic_plant_protection · synthetic_harvest · synthetic_irrigation</div>
      </div>
    </div>
  </q-page>
</template>
