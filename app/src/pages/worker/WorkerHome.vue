<script setup>
import { computed } from 'vue'
import { t } from '../../data/i18n.js'
import { useAuthStore } from '../../stores/auth.js'

const auth = useAuthStore()
const firstName = computed(() => {
  const d = auth.displayName ?? ''
  if (!d) return 'there'
  // Email address → use part before @, capitalize first letter
  const raw = d.includes('@') ? d.split('@')[0] : d.split(' ')[0]
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'there'
})
</script>

<template>
  <q-page class="home-page">
    <!-- Greeting -->
    <div class="home-greeting">
      <div class="text-h6 text-weight-bold">{{ t('hello').replace('{n}', firstName) }}</div>
      <div class="text-caption text-muted">{{ auth.user?.email?.address ?? auth.user?.google?.email }}</div>
    </div>

    <!-- Empty state -->
    <div class="home-empty">
      <q-icon name="o_grass" size="52px" color="grey-4" class="q-mb-sm" />
      <div class="empty-title">No active jobs yet</div>
      <div class="empty-sub">Once you accept a job invitation, your schedule and hours will appear here.</div>
      <q-btn unelevated no-caps color="primary" label="Browse jobs" icon="o_work_outline" to="/worker/jobs" class="q-mt-md" style="border-radius:14px;height:48px;padding:0 24px;" />
    </div>

    <!-- Rights & support pinned to bottom -->
    <div class="home-rights card q-pa-md bg-surface-2 cursor-pointer" @click="$router.push('/worker/rights')">
      <div class="row items-center no-wrap">
        <q-icon name="o_shield" color="primary" size="22px" class="q-mr-sm" />
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">{{ t('rightsSupport') }}</div>
          <div class="text-caption text-muted">{{ t('rightsSupportSub') }}</div>
        </div>
        <q-icon name="chevron_right" color="grey-6" />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 16px 20px;
}
.home-greeting {
  margin-bottom: 0;
}
.home-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}
.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.empty-sub {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
  max-width: 260px;
}
.home-rights {
  margin-top: 0;
  flex-shrink: 0;
}
</style>
