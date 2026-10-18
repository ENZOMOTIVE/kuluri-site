<script setup>
// One conversation. `me` = 'worker' | 'farm'. Each side reads messages in `viewLang` when a translation exists.
import { nextTick, onMounted, reactive, ref, watch, computed } from 'vue'
import { sendMessage, LANG_NAME } from '../data/chats.js'
import { agreements, statusOf, statusColor } from '../data/agreements.js'

const props = defineProps({
  chat: { type: Object, required: true },
  me: { type: String, required: true },
  viewLang: { type: String, default: 'en' }, // language this side reads in
  writeLang: { type: String, default: 'en' }, // language new messages are written in
  labels: { type: Object, required: true }, // { placeholder, send, translatedFrom, showOriginal, showTranslation, noTranslation }
  langName: { type: Function, default: (l) => LANG_NAME[l] ?? l },
  agreementTo: { type: Function, default: null }, // (agreementId) => route for the agreement card button
  statusText: { type: Function, default: (a) => statusOf(a) },
  // When provided, send goes here (Supabase) instead of in-memory; extra messages to display on top of chat.messages
  onSend: { type: Function, default: null },
  extraMessages: { type: Array, default: () => [] },
})

const draft = ref('')
const showOriginal = reactive({})
const scroller = ref(null)

const translated = (m) => m.lang !== props.viewLang && m.tr?.[props.viewLang]
const display = (m, i) => (translated(m) && !showOriginal[i] ? m.tr[props.viewLang] : m.text)
const agreementOf = (m) => agreements.find((a) => a.id === m.agreementId)
const fmtD = (d) => new Date(d).toLocaleDateString(props.viewLang === 'ro' ? 'ro-RO' : 'en-GB', { day: 'numeric', month: 'short' })
const time = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function scrollDown() {
  nextTick(() => { if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight })
}
async function send() {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  if (props.onSend) {
    await props.onSend(text)
  } else {
    sendMessage(props.chat, props.me, text, props.writeLang)
  }
  scrollDown()
}

// All messages: in-memory seeded + Supabase real ones merged by time
const allMessages = computed(() => {
  if (!props.extraMessages.length) return props.chat.messages
  const seeded = props.chat.messages.map((m) => ({ ...m, _src: 'seed' }))
  const real = props.extraMessages.map((m) => ({
    time: m.created_at,
    from: m.sender_role,
    lang: m.lang ?? 'en',
    text: m.text,
    tr: {},
    type: 'text',
    _src: 'real',
    _id: m.id,
  }))
  // Merge: show seeded mock messages only if no real messages exist yet (avoid duplication)
  if (real.length) return real.sort((a, b) => a.time.localeCompare(b.time))
  return seeded
})

onMounted(() => { if (props.chat.unread?.[props.me] != null) props.chat.unread[props.me] = 0; scrollDown() })
watch(() => props.chat.id, () => { if (props.chat.unread?.[props.me] != null) props.chat.unread[props.me] = 0; scrollDown() })
watch(() => allMessages.value.length, () => { scrollDown() })
</script>

<template>
  <div class="thread">
    <div ref="scroller" class="messages">
      <template v-for="(m, i) in allMessages" :key="m._id ?? i">
      <!-- system events (agreement accepted / withdrawn / cancelled) -->
      <div v-if="m.type === 'event'" class="event"><q-icon name="o_handshake" size="14px" class="q-mr-xs" />{{ labels['ev_' + m.event] || m.text }} · {{ time(m.time) }}</div>
      <!-- agreement card -->
      <div v-else-if="m.type === 'agreement' && agreementOf(m)" class="msg-row" :class="m.from === me ? 'mine' : 'theirs'">
        <div class="agreement-card">
          <div class="row items-center no-wrap q-mb-xs">
            <q-icon name="o_handshake" color="primary" size="22px" class="q-mr-sm" />
            <div class="col">
              <div class="text-weight-bold">{{ labels.agreementCard }} {{ m.agreementId }}</div>
              <div class="text-caption text-muted">{{ fmtD(agreementOf(m).terms.start) }} – {{ fmtD(agreementOf(m).terms.end) }} · €{{ agreementOf(m).terms.payPerHour.toFixed(2) }}/h</div>
            </div>
          </div>
          <div class="row items-center justify-between q-mt-sm">
            <q-badge :color="statusColor(agreementOf(m))" :label="statusText(agreementOf(m))" />
            <q-btn v-if="agreementTo" unelevated dense no-caps color="primary" size="sm" class="q-px-sm" :label="labels.open" icon-right="chevron_right" :to="agreementTo(m.agreementId)" />
          </div>
          <div class="text-caption text-muted q-mt-xs">{{ time(m.time) }}</div>
        </div>
      </div>
      <div v-else class="msg-row" :class="m.from === me ? 'mine' : 'theirs'">
        <div class="bubble">
          <div class="text">{{ display(m, i) }}</div>
          <div class="meta">
            <span>{{ time(m.time) }}</span>
            <template v-if="translated(m)">
              · <span>{{ labels.translatedFrom }} {{ langName(m.lang) }}</span>
              · <a href="#" @click.prevent="showOriginal[i] = !showOriginal[i]">{{ showOriginal[i] ? labels.showTranslation : labels.showOriginal }}</a>
            </template>
            <template v-else-if="m.lang !== viewLang && m.from !== me">
              · <span>{{ langName(m.lang) }} – {{ labels.noTranslation }}</span>
            </template>
          </div>
        </div>
      </div>
      </template>
    </div>
    <form class="composer" @submit.prevent="send">
      <q-input v-model="draft" outlined dense autogrow :placeholder="labels.placeholder" class="col" input-style="font-size:15px; max-height:110px" @keydown.enter.exact.prevent="send" />
      <q-btn type="submit" round unelevated color="primary" icon="send" :disable="!draft.trim()" :aria-label="labels.send" />
    </form>
  </div>
</template>

<style scoped>
.thread { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.msg-row { display: flex; }
.msg-row.mine { justify-content: flex-end; }
.bubble { max-width: 82%; padding: 9px 12px; border-radius: 14px; line-height: 1.5; font-size: 15px; }
.theirs .bubble { background: var(--surface-2); border: 1px solid var(--line); border-bottom-left-radius: 4px; color: var(--text); }
.mine .bubble { background: #163300; color: #FFFFFF; border-bottom-right-radius: 4px; }
.meta { font-size: 11px; opacity: 0.75; margin-top: 4px; }
.meta a { color: inherit; text-decoration: underline; }
.event { align-self: center; font-size: 12px; color: var(--muted); background: var(--surface-2); border: 1px solid var(--line); border-radius: 999px; padding: 3px 12px; }
.agreement-card { width: 82%; max-width: 340px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 10px 12px; box-shadow: inset 3px 0 0 #9FE870; }
.composer { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--line); background: var(--surface); }
</style>
