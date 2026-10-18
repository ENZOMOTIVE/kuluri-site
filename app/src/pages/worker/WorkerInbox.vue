<script setup>
// Messages list — one row per farm conversation.
// Tapping a row opens WorkerChat.vue with that specific chat.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { chats } from '../../data/chats.js'
import { agreements, visibleToWorker } from '../../data/agreements.js'
import { state } from '../../data/store.js'

const router = useRouter()

const myChats = computed(() =>
  chats.filter((c) => c.workerId === state.me)
    .slice()
    .sort((a, b) => {
      const ta = a.messages.at(-1)?.time ?? ''
      const tb = b.messages.at(-1)?.time ?? ''
      return tb.localeCompare(ta)
    })
)

const lastMessage = (c) => {
  const m = c.messages.at(-1)
  if (!m) return ''
  const text = m.lang === 'en' ? m.text : (m.tr?.en ?? m.text)
  return (m.from === 'worker' ? 'You: ' : '') + text
}

const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const agreementFor = (c) =>
  agreements.find((a) => a.chatId === c.id && visibleToWorker(a))
</script>

<template>
  <q-page class="inbox-page">

    <div class="inbox-header">Messages</div>

    <!-- No chats -->
    <div v-if="myChats.length === 0" class="inbox-empty">
      <q-icon name="o_chat_bubble_outline" size="48px" color="grey-4" class="q-mb-sm" />
      <div class="inbox-empty-title">No conversations yet</div>
      <div class="inbox-empty-sub">When a farm contacts you, the conversation will appear here.</div>
    </div>

    <!-- Chat rows -->
    <div v-else class="inbox-list">
      <div
        v-for="c in myChats"
        :key="c.id"
        class="inbox-row"
        @click="router.push('/worker/chat?id=' + c.id)"
      >
        <!-- Farm avatar -->
        <div class="ir-avatar">
          <q-icon name="o_agriculture" size="20px" color="white" />
          <div v-if="c.unread.worker > 0" class="ir-dot">{{ c.unread.worker }}</div>
        </div>

        <!-- Content -->
        <div class="ir-content">
          <div class="ir-top">
            <div class="ir-farm">{{ c.farmId }}</div>
            <div class="ir-time">{{ fmtTime(c.messages.at(-1)?.time) }}</div>
          </div>
          <div class="ir-job">{{ c.job }}</div>
          <div class="ir-last" :class="{ 'ir-last--unread': c.unread.worker > 0 }">
            {{ lastMessage(c) }}
          </div>
          <!-- Agreement status pill -->
          <div v-if="agreementFor(c)" class="ir-agreement-pill">
            <q-icon
              :name="agreementFor(c).state === 'sent' ? 'o_pending' : 'o_verified'"
              size="12px"
              class="q-mr-xs"
            />
            {{ agreementFor(c).state === 'sent' ? 'Agreement waiting' : 'Agreement signed' }}
          </div>
        </div>

        <q-icon name="chevron_right" size="18px" color="grey-4" class="ir-chevron" />
      </div>
    </div>

  </q-page>
</template>

<style scoped>
.inbox-page {
  background: #f2f2f7;
  min-height: 100%;
}

.inbox-header {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
  padding: 20px 16px 12px;
  background: #f2f2f7;
}

/* Empty */
.inbox-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
}
.inbox-empty-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.inbox-empty-sub { font-size: 13px; color: var(--muted); line-height: 1.5; }

/* List */
.inbox-list {
  background: #fff;
  border-radius: 16px;
  margin: 0 12px;
  overflow: hidden;
}

/* Row */
.inbox-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(0,0,0,0.04);
  position: relative;
}
.inbox-row:last-child { border-bottom: none; }
.inbox-row:active { background: #f5f5f5; }

/* Avatar */
.ir-avatar {
  width: 46px; height: 46px;
  background: var(--sage);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.ir-dot {
  position: absolute;
  top: -4px; right: -4px;
  background: #D94B3E;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  width: 18px; height: 18px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
}

/* Content */
.ir-content { flex: 1; min-width: 0; }
.ir-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1px;
}
.ir-farm {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}
.ir-time {
  font-size: 11px;
  color: var(--muted);
  flex-shrink: 0;
  margin-left: 8px;
}
.ir-job {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ir-last {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ir-last--unread {
  font-weight: 600;
  color: var(--text);
}
.ir-agreement-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--sage);
  background: var(--lime-soft);
  border-radius: 6px;
  padding: 2px 7px;
  margin-top: 5px;
}

.ir-chevron { flex-shrink: 0; }
</style>
