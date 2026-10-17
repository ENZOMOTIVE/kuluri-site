<script setup>
import { computed, ref } from 'vue'
import ChatThread from '../../components/ChatThread.vue'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { chats } from '../../data/chats.js'
import { forChat } from '../../data/agreements.js'

const openId = ref(chats[0]?.id)
const chat = computed(() => chats.find((c) => c.id === openId.value))
const last = (c) => c.messages[c.messages.length - 1]
const preview = (c) => { const m = last(c); return (m.lang !== 'en' && m.tr?.en) || m.text }
const time = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

// The farm reads and writes in English here; seeded messages carry translations from Romanian.
const labels = {
  placeholder: 'Write a message…', send: 'Send', translatedFrom: 'Translated from',
  showOriginal: 'Show original', showTranslation: 'Show translation', noTranslation: 'live translation is a next step',
  agreementCard: 'Job agreement', open: 'Open', ev_accepted: 'Agreement accepted by the worker', ev_withdrawn: 'You withdrew the agreement', ev_cancelled: 'You cancelled the agreement',
}
</script>

<template>
  <q-page class="page">
    <div class="page-header">
      <h1 class="page-title">Messages</h1>
      <div class="text-muted q-mt-xs">Talk to workers before and during the job. Messages are translated into each person’s language.</div>
    </div>
    <SimulatedNote text="Conversations are simulated and kept in memory. Seeded messages include translations; live translation of new messages needs a translation service (next step)." />

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-4">
        <div class="card">
          <q-list separator>
            <q-item v-for="c in chats" :key="c.id" clickable :active="c.id === openId" active-class="bg-sage-soft" @click="openId = c.id">
              <q-item-section avatar><q-avatar class="bg-sage-soft text-primary text-weight-bold">{{ c.workerName.split(' ').map((s) => s[0]).join('') }}</q-avatar></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ c.workerName }}</q-item-label>
                <q-item-label caption lines="1">{{ preview(c) }}</q-item-label>
              </q-item-section>
              <q-item-section side top>
                <q-item-label caption>{{ time(last(c).time) }}</q-item-label>
                <q-badge v-if="c.unread.farm" rounded color="negative" :label="c.unread.farm" class="q-mt-xs" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
      <div class="col-12 col-md-8" v-if="chat">
        <div class="card column no-wrap" style="height: 560px; overflow: hidden">
          <div class="row items-center q-px-md q-py-sm" style="border-bottom: 1px solid var(--line)">
            <div class="col">
              <div class="text-weight-bold">{{ chat.workerName }} <span class="text-caption text-muted">· {{ chat.workerId }}</span></div>
              <div class="text-caption text-muted">{{ chat.job }}</div>
            </div>
            <q-btn flat dense no-caps color="primary" icon="o_person_search" label="Profile" to="/farm/find" />
            <q-btn unelevated dense no-caps color="primary" icon="o_handshake" class="q-ml-sm q-px-sm" :label="forChat(chat.id) ? 'Agreement' : 'Create agreement'" :to="{ path: '/farm/agreements', query: { chat: chat.id } }" />
          </div>
          <ChatThread class="col" :chat="chat" me="farm" view-lang="en" write-lang="en" :labels="labels" :agreement-to="(id) => ({ path: '/farm/agreements', query: { id } })" />
        </div>
      </div>
    </div>
  </q-page>
</template>
