<script setup>
// Post a new job or edit an existing one. Pay, hours and housing are always shown to workers.
import { computed, ref, watch } from 'vue'
import { SKILLS, LANGS, farm } from '../data/store.js'

const props = defineProps({
  modelValue: Boolean,
  job: { type: Object, default: null }, // null = new job
})
const emit = defineEmits(['update:modelValue', 'save'])

const empty = () => ({ title: '', crop: farm.crops[0], tasks: [], start: '', end: '', positions: 1, payPerHour: 12, hoursPerWeek: 40, housing: false, languages: ['Italian'] })
const draft = ref(empty())
watch(() => props.modelValue, (open) => {
  if (open) draft.value = props.job ? { ...props.job, tasks: [...props.job.tasks], languages: [...props.job.languages] } : empty()
})
const valid = computed(() => draft.value.title && draft.value.tasks.length && draft.value.start && draft.value.end)
function save() { emit('save', { ...draft.value }); emit('update:modelValue', false) }
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <q-card style="width: 640px; max-width: 95vw" class="rounded">
      <q-card-section class="row items-center">
        <div class="text-h6 text-weight-bold">{{ job ? 'Edit job posting' : 'New job posting' }}</div>
        <q-space /><q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <q-input class="col-12" outlined dense v-model="draft.title" label="Job title" placeholder="e.g. Sunflower harvest – grain handling" />
          <q-select class="col-6" outlined dense v-model="draft.crop" :options="farm.crops" label="Crop" />
          <q-input class="col-6" outlined dense type="number" v-model.number="draft.positions" label="Positions" min="1" />
          <q-select class="col-12" outlined dense v-model="draft.tasks" :options="SKILLS" multiple use-chips label="Tasks / skills needed" />
          <q-input class="col-6" outlined dense type="date" v-model="draft.start" label="Start" stack-label />
          <q-input class="col-6" outlined dense type="date" v-model="draft.end" label="End" stack-label />
          <q-input class="col-6" outlined dense type="number" step="0.5" v-model.number="draft.payPerHour" label="Pay per hour (gross €)" />
          <q-input class="col-6" outlined dense type="number" v-model.number="draft.hoursPerWeek" label="Hours per week" />
          <q-select class="col-12" outlined dense v-model="draft.languages" :options="LANGS" multiple use-chips label="Languages spoken on the farm" />
          <q-toggle class="col-12" v-model="draft.housing" label="Housing provided" color="primary" />
        </div>
        <div class="text-caption text-muted q-mt-sm"><q-icon name="o_visibility" /> Pay, hours and housing are always shown to workers. Kuluri is free for workers – no fees.</div>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps label="Cancel" v-close-popup />
        <q-btn unelevated no-caps color="primary" :label="job ? 'Save changes' : 'Publish job'" :disable="!valid" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
