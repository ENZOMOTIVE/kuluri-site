<script setup>
// The farm decides what workers see about it. Changes apply right away in the worker app (job page).
// Below: what workers chose to share with farms – the farm sees only that.
import { QPage } from 'quasar'
import { computed } from 'vue'
import { state, fairRecord, farmView } from '../../data/store.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

const ITEMS = [
  ['fairRecord', 'o_verified', 'Fair-employer record', () => `${fairRecord.value.confirmedShare}% of records confirmed by workers · ${fairRecord.value.writtenTerms}% written terms`],
  ['returning', 'o_autorenew', 'Returning workers', () => `${fairRecord.value.returning} workers came back for another season`],
  ['housing', 'o_home', 'Housing details', () => 'Where workers live, distance from the farmyard'],
  ['location', 'o_place', 'Farm location on the map', () => 'Farmyard and meeting point, with directions'],
]

const views = computed(() => state.workers.map(farmView))
const summary = computed(() => [
  ['Workers who can find you', views.value.filter((w) => w.visible).length, `of ${views.value.length}`],
  ['Jobs hidden by workers', views.value.reduce((a, w) => a + w.hiddenJobs, 0), 'in work histories'],
  ['Workers hiding their hours', views.value.filter((w) => !w.share.hours).length, 'hours not shown'],
  ['Only visible after contact', views.value.filter((w) => w.share.audience === 'applied').length, 'workers'],
])
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div v-if="!embedded" class="page-header">
      <h1 class="page-title">Privacy &amp; sharing</h1>
      <div class="text-muted q-mt-xs">You decide what workers see about your farm. Workers decide what you see about them.</div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-7">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Shown to workers</div>
        <div class="card">
          <q-list separator>
            <q-item v-for="[key, icon, label, detail] in ITEMS" :key="key" tag="label">
              <q-item-section avatar><q-avatar rounded size="38px" class="bg-sage-soft text-primary" :icon="icon" font-size="20px" /></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ label }}</q-item-label>
                <q-item-label caption>{{ detail() }}</q-item-label>
                <q-item-label caption :class="state.farmShare[key] ? 'verified' : 'text-muted'">
                  <q-icon :name="state.farmShare[key] ? 'o_visibility' : 'o_visibility_off'" class="q-mr-xs" />{{ state.farmShare[key] ? 'Seen by workers viewing your jobs' : 'Hidden – workers see “the farm does not share this”' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side><q-toggle v-model="state.farmShare[key]" color="primary" /></q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="text-caption text-muted q-mt-sm"><q-icon name="o_lock" class="q-mr-xs" />Always shown on a job: pay per hour, hours per week, dates and whether housing is provided. Workers' names in your team are never shown to other workers.</div>
      </div>

      <div class="col-12 col-md-5">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">What workers share with you</div>
        <div class="row q-col-gutter-sm">
          <div v-for="[k, v, sub] in summary" :key="k" class="col-6">
            <div class="card q-pa-md full-height">
              <div class="kpi-label">{{ k }}</div>
              <div class="text-h6 text-weight-bold">{{ v }}</div>
              <div class="text-caption text-muted">{{ sub }}</div>
            </div>
          </div>
        </div>
        <div class="text-caption text-muted q-mt-sm"><q-icon name="o_shield" class="q-mr-xs" />Each worker controls their own profile in the worker app. Find workers and the season planner show only what they share.</div>
      </div>
    </div>
  </component>
</template>
