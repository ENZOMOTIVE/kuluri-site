<script setup>
import KuluriLogo from '../components/KuluriLogo.vue'
import { lang, t } from '../data/i18n.js'
import { state } from '../data/store.js'
import { unreadFor } from '../data/chats.js'

const unread = unreadFor('worker', state.me)
</script>

<template>
  <div class="phone-wrap">
    <div class="phone">
      <q-layout view="hHh lpR fFf" container style="height: 100vh">
        <q-header class="side">
          <q-toolbar>
            <q-btn flat round dense icon="arrow_back" color="grey-4" to="/" aria-label="Back to start" />
            <q-toolbar-title><KuluriLogo light :size="24" /></q-toolbar-title>
            <q-btn-toggle v-model="lang" dense unelevated rounded size="sm" toggle-color="primary" color="dark" text-color="grey-4"
              :options="[{ label: 'EN', value: 'en' }, { label: 'RO', value: 'ro' }]" />
          </q-toolbar>
        </q-header>

        <q-footer class="bg-surface" style="border-top: 1px solid var(--line)">
          <q-tabs dense no-caps active-color="primary" indicator-color="primary" class="text-grey-7" align="justify">
            <q-route-tab to="/worker" exact icon="o_home" :label="t('home')" />
            <q-route-tab to="/worker/jobs" icon="o_work_outline" :label="t('jobs')">
              <q-badge v-if="Object.entries(state.invitations).some(([k, v]) => k.endsWith(state.me) && v === 'Invited')" color="negative" floating rounded>1</q-badge>
            </q-route-tab>
            <q-route-tab to="/worker/chat" icon="o_forum" :label="t('inbox')">
              <q-badge v-if="unread" color="negative" floating rounded>{{ unread }}</q-badge>
            </q-route-tab>
            <q-route-tab to="/worker/earnings" icon="o_schedule" :label="t('timesheets')">
              <q-badge v-if="state.week.status === 'Pending'" color="warning" floating rounded>1</q-badge>
            </q-route-tab>
            <q-route-tab to="/worker/profile" icon="o_badge" :label="t('profile')" />
          </q-tabs>
        </q-footer>

        <q-page-container>
          <router-view />
        </q-page-container>
      </q-layout>
    </div>
  </div>
</template>
