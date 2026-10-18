<script setup>
import { QPage } from 'quasar'
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import ChatThread from '../../components/ChatThread.vue'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { chats } from '../../data/chats.js'
import { forChat } from '../../data/agreements.js'
import { chatService } from '../../services/chat.service.js'
import { useAuthStore } from '../../stores/auth.js'
import { farm } from '../../data/store.js'

defineProps({ embedded: Boolean })

const auth = useAuthStore()
const openId = ref(chats[0]?.id)
const chat = computed(() => chats.find((c) => c.id === openId.value))

// Real Supabase chats + messages
const supaChats = ref([])           // [{id, worker_privy_did, job_title, ...}]
const realMessages = ref([])        // messages for the currently open chat
const realtimeSub = ref(null)

onMounted(async () => {
  const rows = await chatService.getForFarm(farm.id)
  supaChats.value = rows
  // Auto-open first real chat if no mock chat
  if (!openId.value && rows.length) openId.value = rows[0].id
  if (openId.value) loadMessages(openId.value)
})

onUnmounted(() => { if (realtimeSub.value) chatService.unsubscribe(realtimeSub.value) })

async function loadMessages(chatId) {
  if (realtimeSub.value) chatService.unsubscribe(realtimeSub.value)
  realMessages.value = await chatService.getMessages(chatId)
  realtimeSub.value = chatService.subscribe(chatId, (msg) => {
    realMessages.value.push(msg)
  })
}

watch(openId, (id) => { if (id) loadMessages(id) })

// Merged chat list: mock seeded + real Supabase (avoid duplicates)
const mockIds = new Set(chats.map((c) => c.id))
const allChats = computed(() => {
  const real = supaChats.value
    .filter((c) => !mockIds.has(c.id))
    .map((c) => ({
      id: c.id,
      workerName: c.worker_name ?? c.worker_privy_did?.slice(0, 8) ?? 'Worker',
      job: c.job_title ?? '—',
      farmId: c.farm_id,
      workerId: c.worker_privy_did,
      messages: [{ time: c.created_at, from: 'farm', lang: 'en', text: '(conversation started)', type: 'text', tr: {} }],
      unread: { farm: 0, worker: 0 },
    }))
  return [...chats, ...real]
})

const openChat = computed(() => allChats.value.find((c) => c.id === openId.value))

// Farmer sends via Supabase for real chats, in-memory for mock
async function handleSend(text) {
  const cid = openId.value
  if (!cid) return
  if (mockIds.has(cid)) {
    // mock chat — in-memory only
    const { sendMessage } = await import('../../data/chats.js')
    sendMessage(openChat.value, 'farm', text, 'en')
  } else {
    await chatService.send(cid, auth.walletAddress ?? farm.id, 'farm', text, 'en')
  }
}

const last = (c) => {
  const msgs = c.messages
  return msgs[msgs.length - 1] ?? { time: new Date().toISOString(), text: '' }
}
const preview = (c) => { const m = last(c); return (m.lang !== 'en' && m.tr?.en) || m.text }
const time = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const labels = {
  placeholder: 'Write a message…', send: 'Send', translatedFrom: 'Translated from',
  showOriginal: 'Show original', showTranslation: 'Show translation', noTranslation: 'live translation is a next step',
  agreementCard: 'Job agreement', open: 'Open', ev_accepted: 'Agreement accepted by the worker', ev_withdrawn: 'You withdrew the agreement', ev_cancelled: 'You cancelled the agreement',
}
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div class="page-header">
      <h1 class="page-title">Inbox</h1>
      <div class="text-muted q-mt-xs">Talk to workers before and during the job. Messages are translated into each person’s language.</div>
    </div>
    <SimulatedNote text="Conversations are simulated and kept in memory. Seeded messages include translations; live translation of new messages needs a translation service (next step)." />

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-4">
        <div class="card">
          <q-list separator>
            <q-item v-for="c in allChats" :key="c.id" clickable :active="c.id === openId" active-class="bg-sage-soft" @click="openId = c.id">
              <q-item-section avatar><q-avatar class="bg-sage-soft text-primary text-weight-bold">{{ c.workerName.split(' ').map((s) => s[0]).join('') }}</q-avatar></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ c.workerName }}</q-item-label>
                <q-item-label caption lines="1">{{ preview(c) }}</q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-item-label caption>{{ time(last(c).time) }}</q-item-label>
                <q-badge v-if="c.unread?.farm" rounded color="negative" :label="c.unread.farm" class="q-mt-xs" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
      <div class="col-12 col-md-8" v-if="openChat">
        <div class="card column no-wrap" style="height: 560px; overflow: hidden">
          <div class="row items-center q-px-md q-py-sm" style="border-bottom: 1px solid var(--line)">
            <div class="col">
              <div class="text-weight-bold">{{ openChat.workerName }} <span class="text-caption text-muted">· {{ openChat.workerId }}</span></div>
              <div class="text-caption text-muted">{{ openChat.job }}</div>
            </div>
            <q-btn flat dense no-caps color="primary" icon="o_person_search" label="Profile" to="/farm/candidates" />
            <q-btn unelevated dense no-caps color="primary" icon="o_handshake" class="q-ml-sm q-px-sm" :label="forChat(openChat.id) ? 'Contract' : 'Create contract'" :to="{ path: '/farm/contracts', query: { chat: openChat.id } }" />
          </div>
          <ChatThread class="col" :chat="openChat" me="farm" view-lang="en" write-lang="en" :labels="labels" :on-send="handleSend" :extra-messages="realMessages" :agreement-to="(id) => ({ path: '/farm/contracts', query: { id } })" />
        </div>
      </div>
    </div>
  </component>
</template>
