<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import KuluriLogo from '../components/KuluriLogo.vue'
import { farm } from '../data/store.js'
import { unreadFor } from '../data/chats.js'

const unread = unreadFor('farm')

const $q = useQuasar()
const drawer = ref($q.screen.gt.sm)
const nav = [
  { to: '/farm', label: 'Overview', icon: 'o_space_dashboard', exact: true },
  { to: '/farm/find', label: 'Find workers', icon: 'o_person_search' },
  { to: '/farm/availability', label: 'Availability', icon: 'o_event_available' },
  { to: '/farm/team', label: 'My workers', icon: 'o_groups' },
  { to: '/farm/messages', label: 'Messages', icon: 'o_forum', badge: true },
  { to: '/farm/agreements', label: 'Agreements', icon: 'o_handshake' },
  { to: '/farm/requests', label: 'Buyer requests', icon: 'o_assignment' },
  { to: '/farm/profile', label: 'Farm data', icon: 'o_agriculture' },
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
          <q-item v-for="n in nav" :key="n.to" :to="n.to" :exact="n.exact" clickable v-ripple>
            <q-item-section avatar style="min-width: 36px"><q-icon :name="n.icon" size="20px" /></q-item-section>
            <q-item-section>{{ n.label }}</q-item-section>
            <q-item-section v-if="n.badge && unread" side><q-badge rounded color="negative" :label="unread" /></q-item-section>
          </q-item>
        </q-list>

        <q-space />
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
