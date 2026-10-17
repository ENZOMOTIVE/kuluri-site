import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css'
import 'quasar/src/css/index.sass'
import './css/app.css'

import App from './App.vue'
import router from './router'
import { seedAgreements } from './data/agreements.js'

seedAgreements() // demo: the farm has drafted and confirmed an agreement for Andrei

// Calm "stone & sage" palette (no pure white, no saturated green)
createApp(App)
  .use(Quasar, {
    plugins: { Notify, Dialog },
    config: {
      brand: {
        primary: '#5f7556',
        secondary: '#3e4c39',
        accent: '#668b86',
        dark: '#2c332b',
        positive: '#5f7556',
        negative: '#b0553c',
        info: '#668b86',
        warning: '#c29438',
      },
      notify: { position: 'top', timeout: 3000 },
    },
  })
  .use(router)
  .mount('#app')
