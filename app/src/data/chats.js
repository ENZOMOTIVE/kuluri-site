// Worker <-> farm conversations (SIMULATED, in memory – no server in the prototype).
// Each message keeps the original text and language; seeded messages also carry translations so each side
// reads in their own language. Live translation of new messages would need a translation service (next step).
import { reactive, computed } from 'vue'

export const LANG_NAME = { it: 'Italian', ro: 'Romanian', en: 'English' }

export const chats = reactive([
  {
    id: 'C-1', workerId: 'W-1042', workerName: 'Andrei P.', farmId: 'FARM-13079', job: 'Maize harvest – combine & grain handling',
    unread: { farm: 1, worker: 1 },
    messages: [
      { from: 'farm', time: '2026-10-16T09:12:00', lang: 'it',
        text: 'Ciao Andrei, grazie per l’interesse. La raccolta inizia il 20 ottobre. Puoi arrivare il 19?',
        tr: { en: 'Hi Andrei, thanks for your interest. The harvest starts on 20 October. Can you arrive on the 19th?',
              ro: 'Bună Andrei, mulțumim pentru interes. Recoltarea începe pe 20 octombrie. Poți ajunge pe 19?' } },
      { from: 'worker', time: '2026-10-16T10:03:00', lang: 'ro',
        text: 'Da, pot ajunge pe 19. Cazarea este inclusă?',
        tr: { en: 'Yes, I can arrive on the 19th. Is housing included?', it: 'Sì, posso arrivare il 19. L’alloggio è incluso?' } },
      { from: 'farm', time: '2026-10-16T10:20:00', lang: 'it',
        text: 'Sì, alloggio incluso, a 600 m dalla fattoria. Ci vediamo nel cortile alle 7:00.',
        tr: { en: 'Yes, housing is included, 600 m from the farm. See you in the farmyard at 7:00.',
              ro: 'Da, cazarea este inclusă, la 600 m de fermă. Ne vedem în curtea fermei la ora 7:00.' } },
    ],
  },
  {
    id: 'C-2', workerId: 'S-203', workerName: 'Ahmed T.', farmId: 'FARM-13079', job: 'Grain handling – autumn 2026',
    unread: { farm: 1, worker: 0 },
    messages: [
      { from: 'worker', time: '2026-10-17T06:41:00', lang: 'en',
        text: 'Good morning, I will be 15 minutes late today because of the bus.',
        tr: { it: 'Buongiorno, oggi arriverò con 15 minuti di ritardo a causa dell’autobus.' } },
    ],
  },
])

export function sendMessage(chat, from, text, lang) {
  chat.messages.push({ from, text, lang, time: new Date().toISOString(), tr: {} })
  const other = from === 'farm' ? 'worker' : 'farm'
  chat.unread[other] += 1
}

export const unreadFor = (side, workerId) => computed(() =>
  chats.filter((c) => !workerId || c.workerId === workerId).reduce((a, c) => a + c.unread[side], 0))
