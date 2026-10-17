<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import ChatThread from '../../components/ChatThread.vue'
import { t, lang } from '../../data/i18n.js'
import { state } from '../../data/store.js'
import { chats } from '../../data/chats.js'
import { agreements, visibleToWorker } from '../../data/agreements.js'

const $q = useQuasar()
const chat = computed(() => chats.find((c) => c.workerId === state.me))
const labels = computed(() => ({
  placeholder: t('typeMessage'), send: t('send'), translatedFrom: t('translatedFrom'),
  showOriginal: t('showOriginal'), showTranslation: t('showTranslation'), noTranslation: t('noTranslation'),
  agreementCard: t('agreementCard'), open: t('open'), ev_accepted: t('ev_accepted'), ev_withdrawn: t('ev_withdrawn'), ev_cancelled: t('ev_cancelled'),
}))
const langName = (l) => t('lang_' + l)
const myAgreement = computed(() => agreements.find((a) => a.workerId === state.me && visibleToWorker(a)))
const statusText = (a) => ({ sent: t('st_waitWorker_me'), agreed: t('st_Agreed'), completed: t('st_Completed'), withdrawn: t('st_Withdrawn'), cancelled: t('st_Cancelled'), draft: t('st_Draft') }[a.state])

function report() {
  $q.dialog({ title: t('report'), message: t('reportChat'), cancel: { flat: true, noCaps: true, label: t('cancel') }, ok: { color: 'negative', unelevated: true, noCaps: true, label: t('report') } })
    .onOk(() => $q.notify({ type: 'warning', message: t('reported') }))
}
</script>

<template>
  <q-page class="column no-wrap chat-page">
    <template v-if="chat">
      <div class="row items-center no-wrap q-px-md q-py-sm bg-surface" style="border-bottom: 1px solid var(--line)">
        <q-avatar rounded size="38px" class="bg-sage-soft text-primary q-mr-sm" icon="agriculture" />
        <div class="col">
          <div class="text-weight-bold">{{ chat.farmId }}</div>
          <div class="text-caption text-muted ellipsis">{{ chat.job }}</div>
        </div>
        <q-btn flat dense no-caps color="primary" icon="o_work_outline" :label="t('jobDetails')" :to="`/worker/job/${myAgreement?.jobId ?? 'J-01'}`" />
        <q-btn flat round dense icon="o_flag" color="negative" @click="report" :aria-label="t('report')" />
      </div>
      <div class="q-px-md q-py-xs text-caption text-muted bg-surface-2"><q-icon name="o_paid" class="q-mr-xs" />{{ t('free') }}</div>
      <ChatThread class="col" :chat="chat" me="worker" :view-lang="lang" :write-lang="lang" :labels="labels" :lang-name="langName" :agreement-to="(id) => `/worker/job/${agreements.find((a) => a.id === id)?.jobId ?? 'J-01'}?tab=agreement`" :status-text="statusText" />
    </template>
    <div v-else class="q-pa-lg text-center text-muted">{{ t('noChats') }}</div>
  </q-page>
</template>

<style scoped>
.chat-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
