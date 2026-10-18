import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dialog, copyToClipboard } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import 'quasar/src/css/index.sass'
import './css/app.css'

import App from './App.vue'
import router from './router'
import { seedAgreements } from './data/agreements.js'
import { initPrivy } from './composables/usePrivy.js'

seedAgreements() // demo: the farm has drafted and confirmed an agreement for Andrei

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(Quasar, {
  plugins: { Notify, Dialog },
  config: {
    brand: {
      primary:   '#163300',  // Wise dark forest green
      secondary: '#2B5516',
      accent:    '#9FE870',  // Wise lime
      dark:      '#163300',
      positive:  '#06B483',
      negative:  '#D94B3E',
      info:      '#2B7FBE',
      warning:   '#D9820A',
    },
    notify: { position: 'top', timeout: 3000 },
  },
})
app.use(router)
app.mount('#app')

// Initialise Privy after mount so Pinia is ready.
initPrivy(import.meta.env.VITE_PRIVY_APP_ID ?? 'PRIVY_APP_ID_PLACEHOLDER')

// Android back button: minimise instead of navigating into login/auth flow
import('@capacitor/app').then(({ App: CapApp }) => {
  CapApp.addListener('backButton', () => {
    const path = router.currentRoute.value.path
    // At app roots or auth screens → minimise
    if (['/worker', '/farm', '/login', '/setup'].includes(path) || path === '/') {
      CapApp.minimizeApp()
    } else {
      router.back()
    }
  })
}).catch(() => {}) // web: no-op
