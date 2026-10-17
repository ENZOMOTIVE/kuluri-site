<script setup>
import KuluriLogo from '../components/KuluriLogo.vue'
</script>

<template>
  <q-layout view="lHh lpR lFf">
    <q-page-container>
      <q-page class="flex flex-center q-pa-lg">
        <div style="max-width: 760px; width: 100%">
          <div class="text-center q-mb-xl">
            <KuluriLogo :size="52" />
            <div class="text-h6 text-weight-bold q-mt-md">Fair seasonal work, verified.</div>
            <div class="text-muted">Kuluri connects farms and seasonal workers through work records the workers confirm themselves.</div>
          </div>

          <div class="row q-col-gutter-lg">
            <div class="col-12 col-sm-6">
              <q-card flat bordered class="rounded cursor-pointer full-height role-card" @click="$router.push('/farm')">
                <q-card-section>
                  <q-avatar size="52px" rounded class="bg-sage-soft text-primary" icon="o_agriculture" font-size="28px" />
                  <div class="text-h6 text-weight-bold q-mt-md">I run a farm</div>
                  <div class="text-muted q-mt-xs">Find reliable workers, keep work records, and answer buyers’ labour questions with proof.</div>
                </q-card-section>
                <q-card-actions class="q-px-md q-pb-md"><q-btn unelevated color="primary" label="Continue as farm" icon-right="arrow_forward" no-caps /></q-card-actions>
              </q-card>
            </div>
            <div class="col-12 col-sm-6">
              <q-card flat bordered class="rounded cursor-pointer full-height role-card" @click="$router.push('/worker')">
                <q-card-section>
                  <q-avatar size="52px" rounded class="bg-sage-soft text-accent" icon="o_badge" font-size="28px" />
                  <div class="text-h6 text-weight-bold q-mt-md">I work on farms</div>
                  <div class="text-muted q-mt-xs">See fair jobs, keep your own proof of hours and pay, and build a verified work history.</div>
                </q-card-section>
                <q-card-actions class="q-px-md q-pb-md"><q-btn unelevated color="accent" label="Continue as worker" icon-right="arrow_forward" no-caps /></q-card-actions>
              </q-card>
            </div>
          </div>
          <div class="text-center text-caption text-muted q-mt-xl">Prototype · EU Agri-Hackathon 2026 · Team 27</div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.role-card { transition: border-color 0.15s, transform 0.15s; }
.role-card:hover { border-color: #a9b99e; transform: translateY(-2px); }
</style>
