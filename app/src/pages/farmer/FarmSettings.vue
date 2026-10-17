<script setup>
// Settings: farm details (what workers need to know) and privacy & sharing.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FarmSharing from './FarmSharing.vue'
import { state, farm } from '../../data/store.js'

const route = useRoute()
const router = useRouter()
const tab = ref(route.query.tab === 'privacy' ? 'privacy' : 'details')
watch(tab, (t) => router.replace({ query: { tab: t } }))

const languages = computed(() => [...new Set(state.jobs.flatMap((j) => j.languages))])
const details = computed(() => [
  ['o_badge', 'Farm ID', farm.id],
  ['o_place', 'Region', farm.region],
  ['o_my_location', 'Farmyard & meeting point', `${farm.location.lat.toFixed(3)}, ${farm.location.lng.toFixed(3)} (approximate in the demo)`],
  ['o_home', 'Worker housing', '~ 600 m from the farmyard'],
  ['o_translate', 'Languages spoken on the farm', languages.value.join(', ')],
  ['o_grass', 'Crops', farm.crops.join(', ')],
])
</script>

<template>
  <q-page class="page">
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
      <div class="text-muted q-mt-xs">Your farm details and what you share with workers.</div>
    </div>

    <q-tabs v-model="tab" dense no-caps align="left" active-color="primary" indicator-color="primary" class="text-grey-8 q-mb-lg">
      <q-tab name="details" icon="o_agriculture" label="Farm details" />
      <q-tab name="privacy" icon="o_visibility" label="Privacy & sharing" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="bg-transparent">
      <q-tab-panel name="details" class="q-pa-none">
        <div class="card" style="max-width: 720px">
          <q-list separator>
            <q-item v-for="[icon, k, v] in details" :key="k">
              <q-item-section avatar><q-icon :name="icon" color="primary" /></q-item-section>
              <q-item-section>
                <q-item-label caption>{{ k }}</q-item-label>
                <q-item-label class="text-weight-medium">{{ v }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="text-caption text-muted q-mt-sm"><q-icon name="o_info" class="q-mr-xs" />Workers see these details on your job postings, depending on Privacy &amp; sharing.</div>
      </q-tab-panel>
      <q-tab-panel name="privacy" class="q-pa-none">
        <FarmSharing embedded class="q-pa-none" />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>
