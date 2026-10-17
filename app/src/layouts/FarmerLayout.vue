<script setup>
import { ref } from 'vue'
import KuluriLogo from '../components/KuluriLogo.vue'
import { farm } from '../data/store.js'
import { unreadFor } from '../data/chats.js'
import { state } from '../data/store.js'

const unread = unreadFor('farm')

// Desktop sidebar sections
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
  <!-- ── MOBILE layout: no drawer, bottom tabs ── -->
  <q-layout v-if="$q.screen.lt.md" view="hHh lpR fFf">
    <q-header class="fl-header">
      <q-toolbar class="fl-toolbar">
        <q-toolbar-title class="fl-title"><KuluriLogo light :size="20" /></q-toolbar-title>
        <q-btn flat round dense icon="o_settings" color="grey-3" size="sm" to="/farm/settings" />
      </q-toolbar>
    </q-header>

    <q-footer class="footer-nav" bordered>
      <q-tabs no-caps active-color="primary" indicator-color="transparent" class="text-grey-5 fl-tabs" align="justify">
        <q-route-tab to="/farm" exact icon="o_space_dashboard" label="Home" />
        <q-route-tab to="/farm/jobs" icon="o_work_outline" label="Jobs" />
        <q-route-tab to="/farm/candidates" icon="o_person_search" label="Find" />
        <q-route-tab to="/farm/inbox" icon="o_forum" label="Inbox">
          <q-badge v-if="unread" color="negative" floating rounded>{{ unread }}</q-badge>
        </q-route-tab>
        <q-route-tab to="/farm/profile" icon="o_person_outline" label="Profile" />
      </q-tabs>
    </q-footer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>

  <!-- ── DESKTOP layout: left sidebar ── -->
  <q-layout v-else view="lHh LpR lFf">
    <q-drawer show-if-above :width="252" class="side" :breakpoint="1023">
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
            <q-item-label caption style="color: var(--side-dim)">{{ farm.region }}</q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* Mobile header */
.fl-header {
  background: #163300;
}
.fl-toolbar {
  min-height: 44px;
  padding: 0 14px;
}
.fl-title {
  padding: 0;
}

/* Mobile bottom tabs */
.footer-nav {
  background: #fff;
  border-top: 0.5px solid #e5e5ea;
}
:deep(.fl-tabs) {
  height: 56px;
  min-height: 56px;
}
:deep(.fl-tabs .q-tab) {
  padding: 6px 0 4px;
  min-height: 56px;
  max-height: 56px;
  overflow: visible;
}
:deep(.fl-tabs .q-tab__label) {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-top: 2px;
  white-space: nowrap;
  display: block !important;
  opacity: 1 !important;
}
:deep(.fl-tabs .q-tab__content) {
  flex-direction: column;
  align-items: center;
  flex-wrap: nowrap;
}

/* Desktop sidebar */
.nav-section { padding: 18px 20px 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--side-dim); }
.nav-item { min-height: 40px; }
</style>
