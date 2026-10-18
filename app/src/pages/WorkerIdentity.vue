<script setup>
// Identity & Wallet page — replaces the old "Earnings" tab concept.
// Shows the user's Privy-managed embedded wallet address, verification status,
// and profile details. The wallet enables digital signatures on mutual agreements.
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { usePrivy } from '../composables/usePrivy.js'
import { t } from '../data/i18n.js'
import { state } from '../data/store.js'

const auth = useAuthStore()
const { logout } = usePrivy()

const me = computed(() => state.workers.find((w) => w.id === state.me))

const walletItems = computed(() => [
  { label: 'Wallet address', value: auth.walletAddress ?? '—', mono: true },
  { label: 'Chain', value: 'Ethereum' },
  { label: 'Type', value: 'Embedded (non-custodial)' },
  { label: 'Provider', value: 'Privy' },
])

const profileItems = computed(() => [
  { label: 'Name', value: auth.displayName },
  { label: 'Worker ID', value: me.value?.id ?? '—' },
  { label: 'Base', value: me.value?.base ?? '—' },
  { label: 'Languages', value: me.value?.languages?.join(', ') ?? '—' },
])
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-caption text-muted q-mb-md"><q-icon name="o_info" /> {{ t('demo') }}</div>

    <!-- Avatar + name -->
    <div class="card q-pa-md q-mb-md row items-center no-wrap q-gutter-x-md">
      <q-avatar size="56px" class="bg-sage-soft text-primary text-weight-bold" font-size="20px">
        {{ auth.avatarInitials }}
      </q-avatar>
      <div>
        <div class="text-h6 text-weight-bold">{{ auth.displayName }}</div>
        <div class="text-caption text-muted">{{ me?.base }}</div>
      </div>
    </div>

    <!-- Wallet -->
    <div class="text-subtitle2 text-weight-bold q-mb-sm">
      <q-icon name="o_account_balance_wallet" color="primary" class="q-mr-xs" />Embedded Wallet
    </div>
    <div class="card q-mb-md">
      <q-list separator dense>
        <q-item v-for="item in walletItems" :key="item.label">
          <q-item-section class="text-muted" style="max-width: 44%">{{ item.label }}</q-item-section>
          <q-item-section :class="item.mono ? 'mono text-caption' : 'text-weight-medium'">{{ item.value }}</q-item-section>
          <q-item-section v-if="item.mono && auth.walletAddress" side>
            <q-btn flat dense round icon="o_copy" size="sm" color="grey-6"
              @click="$q.copyToClipboard(auth.walletAddress)" />
          </q-item-section>
        </q-item>
      </q-list>
      <div class="q-pa-md q-pt-sm text-caption text-muted">
        <q-icon name="o_shield" size="14px" class="q-mr-xs" />
        Your wallet keys are stored only on your device — Kuluri never holds them.
        It is used to digitally sign mutual agreements with farms.
      </div>
    </div>

    <!-- Profile info -->
    <div class="text-subtitle2 text-weight-bold q-mb-sm">
      <q-icon name="o_badge" color="primary" class="q-mr-xs" />Profile
    </div>
    <div class="card q-mb-md">
      <q-list separator dense>
        <q-item v-for="item in profileItems" :key="item.label">
          <q-item-section class="text-muted" style="max-width: 44%">{{ item.label }}</q-item-section>
          <q-item-section class="text-weight-medium">{{ item.value }}</q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Signed agreements shortcut -->
    <div class="card q-pa-md q-mb-md cursor-pointer row items-center no-wrap" @click="$router.push('/worker/jobs')">
      <q-icon name="o_handshake" color="primary" size="22px" class="q-mr-sm" />
      <div class="col">
        <div class="text-subtitle2 text-weight-bold">Agreements signed</div>
        <div class="text-caption text-muted">View your signed contracts with farms</div>
      </div>
      <q-icon name="chevron_right" color="grey-6" />
    </div>

    <!-- Sign out -->
    <div class="card">
      <q-item clickable v-ripple @click="logout">
        <q-item-section avatar><q-icon name="o_logout" color="negative" /></q-item-section>
        <q-item-section class="text-negative text-weight-medium">Sign out</q-item-section>
      </q-item>
    </div>
  </q-page>
</template>
