<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import ChatThread from '../../components/ChatThread.vue'
import { t, lang } from '../../data/i18n.js'
import { state } from '../../data/store.js'
import { chats, sendMessage } from '../../data/chats.js'
import { agreements, visibleToWorker } from '../../data/agreements.js'
import { chatService } from '../../services/chat.service.js'
import { useAuthStore } from '../../stores/auth.js'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Real Supabase messages for real users (keyed by chatId)
const realMessages = ref([])
const realtimeSub = ref(null)

// Support ?id=C-1 from inbox rows and Home quick-action; fallback to first worker chat
const chat = computed(() => {
  const id = route.query.id
  return id
    ? chats.find((c) => c.id === id)
    : chats.find((c) => c.workerId === state.me)
})

// If no mock chat found, try Supabase (real user chat)
const realChatId = computed(() => route.query.id && !chat.value ? route.query.id : null)

onMounted(async () => {
  const chatId = route.query.id
  if (!chatId) return
  // Load real messages from Supabase
  const msgs = await chatService.getMessages(chatId)
  realMessages.value = msgs
  // Subscribe to new messages
  realtimeSub.value = chatService.subscribe(chatId, (msg) => {
    realMessages.value.push(msg)
  })
})

onUnmounted(() => {
  if (realtimeSub.value) chatService.unsubscribe(realtimeSub.value)
})

async function sendReal(text) {
  const chatId = route.query.id
  if (!chatId || !auth.user?.id) return
  await chatService.send(chatId, auth.user.id, 'worker', text, lang.value)
}
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
        <q-btn flat round dense icon="arrow_back" color="grey-7" class="q-mr-xs" @click="router.push('/worker/inbox')" />
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
