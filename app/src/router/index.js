import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history: works on static hosting and inside the Android (Capacitor) WebView.
const routes = [
  { path: '/', component: () => import('../pages/RoleSelect.vue') },
  {
    path: '/farm',
    component: () => import('../layouts/FarmerLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/farmer/FarmerHome.vue') },
      { path: 'find', component: () => import('../pages/farmer/FindWorkers.vue') },
      { path: 'availability', component: () => import('../pages/farmer/FarmAvailability.vue') },
      { path: 'team', component: () => import('../pages/farmer/MyWorkers.vue') },
      { path: 'requests', component: () => import('../pages/farmer/BuyerRequests.vue') },
      { path: 'profile', component: () => import('../pages/farmer/FarmProfile.vue') },
      { path: 'messages', component: () => import('../pages/farmer/FarmMessages.vue') },
      { path: 'agreements', component: () => import('../pages/farmer/FarmAgreements.vue') },
    ],
  },
  {
    path: '/worker',
    component: () => import('../layouts/WorkerLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/worker/WorkerProfile.vue') },
      { path: 'jobs', component: () => import('../pages/worker/WorkerJobs.vue') },
      { path: 'confirm', component: () => import('../pages/worker/WorkerConfirm.vue') },
      { path: 'earnings', component: () => import('../pages/worker/WorkerEarnings.vue') },
      { path: 'job/:id', component: () => import('../pages/worker/WorkerJob.vue') },
      { path: 'farm', redirect: '/worker/job/J-01?tab=location' },
      { path: 'chat', component: () => import('../pages/worker/WorkerChat.vue') },
      { path: 'agreement', redirect: '/worker/job/J-01?tab=agreement' },
    ],
  },
]

export default createRouter({ history: createWebHashHistory(), routes })
