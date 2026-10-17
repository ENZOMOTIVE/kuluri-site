<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import KuluriLogo from '../components/KuluriLogo.vue'
import { farm } from '../data/store.js'
import { unreadFor } from '../data/chats.js'

const unread = unreadFor('farm')

const $q = useQuasar()
const drawer = ref($q.screen.gt.sm)
// Grouped navigation, like a production HR / recruiting app
const sections = [
  { items: [{ to: '/farm', label: 'Dashboard', icon: 'o_space_dashboard', exact: true }] },
  { title: 'Hiring', items: [
    { to: '/farm/jobs', label: 'Job postings', icon: 'o_work_outline' },
    { to: '/farm/candidates', label: 'Candidates', icon: 'o_person_search' },
    { to: '/farm/inbox', label: 'Inbox', icon: 'o_forum', badge: true },
    { to: '/farm/contracts', label: 'Contracts', icon: 'o_handshake' },
  ] },
  { title: 'Workforce', items: [
    { to: '/farm/team', label: 'Team', icon: 'o_groups' },
    { to: '/farm/schedule', label: 'Schedule', icon: 'o_calendar_month' },
  ] },
  { title: 'Insights', items: [{ to: '/farm/impact', label: 'Impact report', icon: 'o_insights' }] },
]
</script>

<template>
  <q-layout view="lHh LpR lFf">
    <q-header v-if="$q.screen.lt.md" class="side" style="border-bottom: 1px solid rgba(236,230,216,.1)">
      <q-toolbar>
        <q-btn flat round dense icon="menu" color="grey-4" @click="drawer = !drawer" />
        <q-toolbar-title><KuluriLogo light :size="26" /></q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="252" class="side" :breakpoint="1023">
      <div class="column full-height no-wrap">
        <div class="q-pa-lg q-pb-md cursor-pointer" @click="$router.push('/farm')"><KuluriLogo light :size="30" /></div>
        <q-list class="q-mt-sm">
          <template v-for="(sec, i) in sections" :key="i">
            <div v-if="sec.title" class="nav-section">{{ sec.title }}</div>
            <q-item v-for="n in sec.items" :key="n.to" :to="n.to" :exact="n.exact" clickable v-ripple dense class="nav-item">
              <q-item-section avatar style="min-width: 36px"><q-icon :name="n.icon" size="20px" /></q-item-section>
              <q-item-section>{{ n.label }}</q-item-section>
              <q-item-section v-if="n.badge && unread" side><q-badge rounded color="negative" :label="unread" /></q-item-section>
            </q-item>
          </template>
        </q-list>

        <q-space />
        <q-item clickable v-ripple dense to="/farm/settings" class="nav-item q-mb-sm">
          <q-item-section avatar style="min-width: 36px"><q-icon name="o_settings" size="20px" /></q-item-section>
          <q-item-section>Settings</q-item-section>
        </q-item>
        <q-separator class="q-mx-md" />
        <q-item class="q-mt-sm">
          <q-item-section avatar style="min-width: 44px"><q-avatar rounded size="36px" style="background: var(--side-active); color: var(--side-text)" class="text-weight-bold">FA</q-avatar></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold" style="color: var(--side-text)">{{ farm.id }}</q-item-label>
            <q-item-label caption style="color: var(--side-dim)">Milano (IT)</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable to="/worker" class="q-mb-md">
          <q-item-section avatar style="min-width: 36px"><q-icon name="o_smartphone" size="20px" /></q-item-section>
          <q-item-section>Worker app (demo)</q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.nav-section { padding: 18px 20px 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--side-dim); }
.nav-item { min-height: 40px; }
</style>
