import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Hash history: works on static hosting and inside the Android (Capacitor) WebView.
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login',         component: () => import('../pages/AuthLogin.vue') },
  { path: '/setup',         component: () => import('../pages/SetupRole.vue'),   meta: { requiresAuth: true } },
  { path: '/auth/callback', component: () => import('../pages/AuthCallback.vue') },
  { path: '/select-role',   component: () => import('../pages/RoleSelect.vue') },
  {
    path: '/farm',
    meta: { requiresAuth: true, role: 'farmer' },
    component: () => import('../layouts/FarmerLayout.vue'),
    children: [
      { path: '',           component: () => import('../pages/farmer/FarmerHome.vue') },
      { path: 'jobs',       component: () => import('../pages/farmer/FarmJobs.vue') },
      { path: 'candidates', component: () => import('../pages/farmer/FindWorkers.vue') },
      { path: 'inbox',      component: () => import('../pages/farmer/FarmMessages.vue') },
      { path: 'contracts',  component: () => import('../pages/farmer/FarmAgreements.vue') },
      { path: 'team',       component: () => import('../pages/farmer/MyFarm.vue') },
      { path: 'schedule',   component: () => import('../pages/farmer/FarmCalendar.vue') },
      { path: 'impact',     component: () => import('../pages/farmer/FarmImpact.vue') },
      { path: 'settings',   component: () => import('../pages/farmer/FarmSettings.vue') },
      { path: 'find',       redirect: to => ({ path: '/farm/candidates', query: to.query }) },
      { path: 'messages',   redirect: '/farm/inbox' },
      { path: 'agreements', redirect: to => ({ path: '/farm/contracts', query: to.query }) },
      { path: 'availability', redirect: '/farm/schedule' },
      { path: 'sharing',    redirect: '/farm/settings?tab=privacy' },
      { path: 'profile',    component: () => import('../pages/farmer/FarmerProfile.vue') },
    ],
  },
  {
    path: '/worker',
    meta: { requiresAuth: true, role: 'worker' },
    component: () => import('../layouts/WorkerLayout.vue'),
    children: [
      { path: '',           component: () => import('../pages/worker/WorkerHome.vue') },
      { path: 'profile',    component: () => import('../pages/worker/WorkerProfile.vue') },
      { path: 'jobs',       component: () => import('../pages/worker/WorkerJobs.vue') },
      { path: 'identity',   redirect: '/worker/profile' },
      { path: 'confirm',    redirect: '/worker/earnings?tab=confirm' },
      { path: 'earnings',   component: () => import('../pages/combined/WorkerHoursPay.vue') },
      { path: 'job/:id',    component: () => import('../pages/worker/WorkerJob.vue') },
      { path: 'farm',       redirect: '/worker/job/J-01?tab=location' },
      { path: 'inbox',       component: () => import('../pages/worker/WorkerInbox.vue') },
      { path: 'chat',       component: () => import('../pages/worker/WorkerChat.vue') },
      { path: 'history',    component: () => import('../pages/worker/WorkerHistory.vue') },
      { path: 'sharing',    component: () => import('../pages/worker/WorkerSharing.vue') },
      { path: 'rights',     component: () => import('../pages/worker/WorkerRights.vue') },
      { path: 'agreement',  redirect: '/worker/job/J-01?tab=agreement' },
    ],
  },
]

const router = createRouter({ history: createWebHashHistory(), routes })

// Auth guard — waits for Privy SDK to finish initialising before deciding.
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const auth = useAuthStore()

  // Wait for Privy to finish its session restore (up to 4 s)
  if (!auth.ready) {
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 4000)
      const stop = auth.$subscribe(() => {
        if (auth.ready) { clearTimeout(t); stop(); resolve() }
      })
    })
  }

  if (!auth.authenticated) return '/login'

  // Role not set yet → send to setup (avoid infinite loop)
  if (!auth.role && to.path !== '/setup') return '/setup'

  return true
})

export default router
