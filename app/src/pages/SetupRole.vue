<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const selected = ref(auth.role ?? null) // pre-select saved role for returning users

function confirm() {
  if (!selected.value) return
  auth.setRole(selected.value) // persists to localStorage
  router.push(selected.value === 'farmer' ? '/farm' : '/worker')
}
</script>

<template>
  <div class="setup-screen">

    <div class="setup-top">
      <div class="setup-step">Account setup · 1 of 1</div>
      <div class="setup-headline">What best describes<br>your role?</div>
      <div class="setup-sub">This lets us show you the right experience. You can always change it later in your profile.</div>
    </div>

    <div class="setup-options">

      <div :class="['setup-option', selected === 'worker' && 'setup-option--selected']"
        @click="selected = 'worker'">
        <div class="setup-option-icon setup-option-icon--worker">
          <q-icon name="o_badge" size="30px" color="primary" />
        </div>
        <div class="setup-option-body">
          <div class="setup-option-title">Seasonal worker</div>
          <div class="setup-option-desc">I look for agricultural jobs and want to track my work and rights</div>
        </div>
        <div class="setup-option-check">
          <q-icon :name="selected === 'worker' ? 'check_circle' : 'radio_button_unchecked'"
            :color="selected === 'worker' ? 'primary' : 'grey-4'" size="22px" />
        </div>
      </div>

      <div :class="['setup-option', selected === 'farmer' && 'setup-option--selected']"
        @click="selected = 'farmer'">
        <div class="setup-option-icon setup-option-icon--farmer">
          <q-icon name="o_agriculture" size="30px" color="secondary" />
        </div>
        <div class="setup-option-body">
          <div class="setup-option-title">Farm employer</div>
          <div class="setup-option-desc">I hire seasonal workers and want to manage jobs and records</div>
        </div>
        <div class="setup-option-check">
          <q-icon :name="selected === 'farmer' ? 'check_circle' : 'radio_button_unchecked'"
            :color="selected === 'farmer' ? 'primary' : 'grey-4'" size="22px" />
        </div>
      </div>
    </div>

    <div class="setup-bottom">
      <button :class="['setup-cta', !selected && 'setup-cta--disabled']" :disabled="!selected" @click="confirm">
        Get started
        <q-icon name="arrow_forward" size="18px" />
      </button>
      <div class="setup-note">This is saved to your account and only asked once.</div>
    </div>

  </div>
</template>

<style scoped>
.setup-screen {
  height: 100dvh;
  background: var(--page-bg);
  display: flex;
  flex-direction: column;
  padding: 0 22px env(safe-area-inset-bottom, 32px);
  overflow: hidden;
}

/* Top */
.setup-top {
  padding-top: 64px;
  margin-bottom: 36px;
}
.setup-step {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}
.setup-headline {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -.03em;
  color: var(--text);
  margin-bottom: 10px;
}
.setup-sub {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}

/* Options */
.setup-options { display: flex; flex-direction: column; gap: 14px; }

.setup-option {
  background: var(--surface);
  border-radius: 20px;
  border: 2px solid transparent;
  padding: 20px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: border-color .15s, box-shadow .15s;
}
.setup-option--selected {
  border-color: var(--sage);
  box-shadow: var(--shadow-md);
}

.setup-option-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.setup-option-icon--worker { background: var(--sage-soft); }
.setup-option-icon--farmer { background: var(--teal-soft); }

.setup-option-body { flex: 1; min-width: 0; }
.setup-option-title { font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -.01em; margin-bottom: 4px; }
.setup-option-desc { font-size: 13px; color: var(--muted); line-height: 1.4; }
.setup-option-check { flex-shrink: 0; }

/* CTA */
.setup-bottom { margin-top: auto; padding-top: 40px; }
.setup-cta {
  width: 100%; height: 54px; border-radius: 16px;
  background: var(--sage); color: #fff;
  font-size: 16px; font-weight: 700; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-family: inherit; transition: opacity .15s;
}
.setup-cta--disabled { opacity: 0.4; cursor: default; }
.setup-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 12px; }
</style>
