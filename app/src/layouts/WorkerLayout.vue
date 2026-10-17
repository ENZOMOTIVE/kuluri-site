<script setup>
import { ref } from 'vue'
import KuluriLogo from '../components/KuluriLogo.vue'
import { lang, t, LANGUAGES } from '../data/i18n.js'
import { state } from '../data/store.js'
import { unreadFor } from '../data/chats.js'

const unread = unreadFor('worker', state.me)
const langPickerOpen = ref(false)

function selectLang(code) {
  lang.value = code
  langPickerOpen.value = false
}
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="side">
      <q-toolbar class="wl-toolbar">
        <q-toolbar-title class="wl-title"><KuluriLogo light :size="20" /></q-toolbar-title>
        <!-- Language picker trigger -->
        <button class="wl-lang-btn" aria-label="Language" @click="langPickerOpen = true">
          <q-icon name="o_language" size="17px" color="white" />
          <span class="lang-chip">{{ lang.toUpperCase() }}</span>
        </button>
      </q-toolbar>
    </q-header>

    <!-- Language picker bottom sheet -->
    <q-dialog v-model="langPickerOpen" position="bottom">
      <q-card class="lang-sheet">
        <div class="lang-sheet-title">Language / Langue / Sprache</div>
        <q-list>
          <q-item v-for="l in LANGUAGES" :key="l.code" clickable @click="selectLang(l.code)"
            :class="{ 'lang-active': lang === l.code }">
            <q-item-section>
              <q-item-label class="lang-native">{{ l.native }}</q-item-label>
              <q-item-label caption class="lang-en">{{ l.label }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="lang === l.code">
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <q-footer class="footer-nav" bordered>
      <q-tabs no-caps active-color="primary" indicator-color="transparent" class="text-grey-5 wl-tabs" align="justify">
        <q-route-tab to="/worker" exact icon="o_home" :label="t('home')" />
        <q-route-tab to="/worker/jobs" icon="o_work_outline" :label="t('jobs')">
          <q-badge v-if="Object.entries(state.invitations).some(([k, v]) => k.endsWith(state.me) && v === 'Invited')" color="negative" floating rounded>1</q-badge>
        </q-route-tab>
        <q-route-tab to="/worker/chat" icon="o_forum" :label="t('inbox')">
          <q-badge v-if="unread" color="negative" floating rounded>{{ unread }}</q-badge>
        </q-route-tab>
        <q-route-tab to="/worker/profile" icon="o_person_outline" :label="t('profile')" />
      </q-tabs>
    </q-footer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
/* ── Compact Wise-style header ── */
.wl-toolbar {
  min-height: 44px;
  padding: 0 14px;
}
.wl-title {
  padding: 0;
}
.wl-lang-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border-radius: 20px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.30);
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.lang-chip {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1;
  color: #fff;
}
/* ── Wise-style bottom tabs ── */
:deep(.wl-tabs) {
  height: 56px;
  min-height: 56px;
}
:deep(.wl-tabs .q-tab) {
  padding: 6px 0 4px;
  min-height: 56px;
  max-height: 56px;
  overflow: visible;
}
:deep(.wl-tabs .q-tab__label) {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-top: 2px;
  white-space: nowrap;
  display: block !important;
  opacity: 1 !important;
}
:deep(.wl-tabs .q-tab__content) {
  flex-direction: column;
  align-items: center;
  flex-wrap: nowrap;
}
.lang-sheet {
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  max-height: 70vh;
  overflow-y: auto;
}
.lang-sheet-title {
  font-size: 13px;
  font-weight: 600;
  color: #8e8e93;
  text-align: center;
  padding: 14px 16px 8px;
  letter-spacing: 0.02em;
}
.lang-native {
  font-size: 16px;
  font-weight: 500;
}
.lang-en {
  font-size: 12px;
  color: #8e8e93;
}
.lang-active {
  background: rgba(0,0,0,0.03);
}
</style>
