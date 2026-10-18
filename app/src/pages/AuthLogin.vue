<script setup>
import { demoIdentityFor } from '../data/demo-identities.js'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePrivy } from '../composables/usePrivy.js'
import { useAuthStore } from '../stores/auth.js'
import KuluriLogo from '../components/KuluriLogo.vue'

const router = useRouter()
const auth = useAuthStore()
const { loginWithGoogle, loginWithEmail, verifyEmailOtp, error } = usePrivy()

const email = ref('')
const otp   = ref('')
const step  = ref('auth') // 'auth' | 'otp'
const busy  = ref(false)

// On app open: if Privy already has a valid session, skip login entirely
onMounted(async () => {
  // Wait up to 4 s for Privy to finish session restore
  if (!auth.ready) {
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 4000)
      const stop = auth.$subscribe((_, state) => {
        if (state.ready) { clearTimeout(t); stop(); resolve() }
      })
    })
  }
  if (auth.authenticated) {
    router.replace(auth.role ? (auth.role === 'farmer' ? '/farm' : '/worker') : '/setup')
  }
})

function _afterAuth() {
  // A known demo address goes straight into its side of the app, so a live
  // demo does not stop on the role picker. Everyone else confirms their role.
  const identity = demoIdentityFor(auth.user)
  if (identity) {
    router.replace(identity.role === 'farmer' ? '/farm' : '/worker')
    return
  }
  router.push('/setup')
}

async function withGoogle() {
  busy.value = true
  await loginWithGoogle()
  busy.value = false
}

async function sendOtp() {
  busy.value = true
  await loginWithEmail(email.value)
  busy.value = false
  step.value = 'otp'
}

async function verifyOtp() {
  busy.value = true
  await verifyEmailOtp(email.value, otp.value)
  busy.value = false
  if (auth.authenticated) _afterAuth()
}
</script>

<template>
  <div class="auth-screen">

    <!-- Photo hero -->
    <div class="auth-hero">
      <div class="auth-hero-overlay" />
      <div class="auth-hero-content">
        <KuluriLogo light :size="32" class="auth-logo" />
        <div class="auth-headline">Fair work,<br>your way.</div>
        <div class="auth-sub">Farm jobs and seasonal workers, matched fairly across Europe.</div>
      </div>
    </div>

    <!-- Bottom sheet -->
    <div class="auth-sheet">

      <template v-if="step === 'auth'">
        <button class="auth-btn auth-btn--google" :disabled="busy" @click="withGoogle">
          <img class="google-logo" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%234285F4' d='M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z'/%3E%3Cpath fill='%2334A853' d='M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.07H4.34v5.7C7.96 40.98 15.4 46 24 46z'/%3E%3Cpath fill='%23FBBC05' d='M11.68 28.18A13.9 13.9 0 0 1 10.8 24c0-1.45.25-2.86.68-4.18v-5.7H4.34A23.93 23.93 0 0 0 0 24c0 3.86.93 7.52 2.56 10.74l7.12-5.7z'/%3E%3Cpath fill='%23EA4335' d='M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.18 29.93 1 24 1 15.4 1 7.96 6.02 4.34 13.28l7.34 5.7C13.42 13.62 18.27 9.75 24 9.75z'/%3E%3C/svg%3E" alt="G" />
          Continue with Google
        </button>

        <div class="auth-divider"><span>or</span></div>

        <input v-model="email" class="auth-input" type="email" inputmode="email"
          placeholder="Your email address" @keyup.enter="sendOtp" />
        <button class="auth-btn auth-btn--primary" :disabled="busy || !email" @click="sendOtp">
          {{ busy ? 'Sending…' : 'Continue with email' }}
        </button>
      </template>

      <template v-else-if="step === 'otp'">
        <div class="otp-heading">Check your inbox</div>
        <div class="otp-sub">6-digit code sent to <strong>{{ email }}</strong></div>
        <input v-model="otp" class="auth-input auth-input--otp" type="text"
          inputmode="numeric" placeholder="000000" maxlength="6" @keyup.enter="verifyOtp" />
        <button class="auth-btn auth-btn--primary" :disabled="busy || otp.length < 6" @click="verifyOtp">
          {{ busy ? 'Verifying…' : 'Verify code' }}
        </button>
        <button class="auth-btn-link" @click="step = 'auth'">← Back</button>
      </template>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <div class="auth-legal">By continuing, a self-custodial wallet is created for you. You keep full control.</div>
    </div>

  </div>
</template>

<style scoped>
.auth-screen {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--side-bg);
  overflow: hidden;
}
.auth-hero {
  flex: 1;
  position: relative;
  background: url('/assets/login-hero.jpg') center 30% / cover no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 0;
}
.auth-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(13,33,24,.08) 0%, rgba(13,33,24,.22) 40%, rgba(13,33,24,.80) 75%, rgba(13,33,24,.96) 100%);
}
.auth-hero-content { position: relative; z-index: 1; padding: 0 28px 32px; }
.auth-logo { margin-bottom: 24px; }
.auth-headline { font-size: 36px; font-weight: 800; line-height: 1.1; letter-spacing: -.03em; color: #fff; margin-bottom: 8px; }
.auth-sub { font-size: 13px; line-height: 1.5; color: rgba(255,255,255,.65); }

.auth-sheet {
  background: var(--surface);
  border-radius: 26px 26px 0 0;
  padding: 24px 22px 36px;
  box-shadow: 0 -8px 32px rgba(0,0,0,.20);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.auth-btn {
  width: 100%; height: 52px; border-radius: 14px; font-size: 15px; font-weight: 700;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 10px; transition: opacity 0.15s; font-family: inherit;
}
.auth-btn:disabled { opacity: 0.5; cursor: default; }
.auth-btn--google { background: var(--surface-2); color: var(--text); border: 1.5px solid var(--line); font-weight: 600; }
.auth-btn--primary { background: var(--sage); color: #fff; }
.google-logo { width: 20px; height: 20px; }
.auth-input {
  width: 100%; height: 52px; border-radius: 14px; border: 1.5px solid var(--line);
  background: var(--surface-2); padding: 0 16px; font-size: 15px; color: var(--text);
  outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.15s;
}
.auth-input:focus { border-color: var(--sage); }
.auth-input--otp { letter-spacing: .2em; text-align: center; font-size: 22px; font-weight: 700; }
.auth-divider { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 12px; margin: 2px 0; }
.auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.otp-heading { font-size: 18px; font-weight: 700; color: var(--text); text-align: center; }
.otp-sub { font-size: 13px; color: var(--muted); text-align: center; margin-bottom: 4px; }
.auth-btn-link { background: none; border: none; color: var(--muted); font-size: 13px; cursor: pointer; padding: 4px 0; text-align: center; font-family: inherit; }
.auth-error { font-size: 13px; color: #D94B3E; text-align: center; }
.auth-legal { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.5; margin-top: 4px; }
</style>
