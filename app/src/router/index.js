import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history: works on static hosting and inside the Android (Capacitor) WebView.
const routes = [
  { path: '/', component: () => import('../pages/RoleSelect.vue') },
  {
    path: '/farm',
    component: () => import('../layouts/FarmerLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/farmer/FarmerHome.vue') }, // Dashboard
      // Hiring
      { path: 'jobs', component: () => import('../pages/farmer/FarmJobs.vue') }, // Job postings
      { path: 'candidates', component: () => import('../pages/farmer/FindWorkers.vue') }, // Candidates
      { path: 'inbox', component: () => import('../pages/farmer/FarmMessages.vue') }, // Inbox
      { path: 'contracts', component: () => import('../pages/farmer/FarmAgreements.vue') }, // Contracts (job agreements)
      // Workforce
      { path: 'team', component: () => import('../pages/farmer/MyFarm.vue') }, // Team
      { path: 'schedule', component: () => import('../pages/farmer/FarmCalendar.vue') }, // Schedule
      // Insights & settings
      { path: 'impact', component: () => import('../pages/farmer/FarmImpact.vue') }, // Impact report
      { path: 'settings', component: () => import('../pages/farmer/FarmSettings.vue') }, // Farm details · Privacy & sharing
      // Old addresses
      { path: 'find', redirect: (to) => ({ path: '/farm/candidates', query: to.query.tab === 'chats' ? {} : to.query }) },
      { path: 'messages', redirect: '/farm/inbox' },
      { path: 'agreements', redirect: (to) => ({ path: '/farm/contracts', query: to.query }) },
      { path: 'availability', redirect: '/farm/schedule' },
      { path: 'sharing', redirect: '/farm/settings?tab=privacy' },
      { path: 'profile', redirect: '/farm/settings' },
    ],
  },
  {
    path: '/worker',
    component: () => import('../layouts/WorkerLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/worker/WorkerHome.vue') }, // Home
      { path: 'profile', component: () => import('../pages/worker/WorkerProfile.vue') }, // Profile: CV & skills, privacy, rights & support
      { path: 'jobs', component: () => import('../pages/worker/WorkerJobs.vue') },
      { path: 'confirm', redirect: '/worker/earnings?tab=confirm' },
      { path: 'earnings', component: () => import('../pages/combined/WorkerHoursPay.vue') },
      { path: 'job/:id', component: () => import('../pages/worker/WorkerJob.vue') },
      { path: 'farm', redirect: '/worker/job/J-01?tab=location' },
      { path: 'chat', component: () => import('../pages/worker/WorkerChat.vue') },
      { path: 'sharing', component: () => import('../pages/worker/WorkerSharing.vue') },
      { path: 'rights', component: () => import('../pages/worker/WorkerRights.vue') },
      { path: 'agreement', redirect: '/worker/job/J-01?tab=agreement' },
    ],
  },
]

export default createRouter({ history: createWebHashHistory(), routes })
