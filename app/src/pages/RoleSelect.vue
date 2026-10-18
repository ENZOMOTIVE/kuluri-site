<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import KuluriLogo from '../components/KuluriLogo.vue'

const router = useRouter()
const auth = useAuthStore()

function choose(role) {
  auth.setRole(role)
  if (auth.authenticated) {
    router.push(role === 'farmer' ? '/farm' : '/worker')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="rs-screen">

    <div class="rs-logo">
      <KuluriLogo :size="32" />
    </div>

    <div class="rs-question">
      What brings you<br>to Kuluri?
    </div>
    <div class="rs-hint">We'll tailor the experience for you</div>

    <div class="rs-tiles">

      <div class="rs-tile" @click="choose('worker')">
        <div class="rs-tile-icon rs-tile-icon--worker">
          <q-icon name="o_badge" size="32px" color="primary" />
        </div>
        <div class="rs-tile-text">
          <div class="rs-tile-title">I'm a seasonal worker</div>
          <div class="rs-tile-desc">Find fair jobs, know your rights and keep your own proof of work</div>
        </div>
        <q-icon name="arrow_forward_ios" size="13px" color="grey-5" class="rs-tile-arrow" />
      </div>

      <div class="rs-tile" @click="choose('farmer')">
        <div class="rs-tile-icon rs-tile-icon--farmer">
          <q-icon name="o_agriculture" size="32px" color="secondary" />
        </div>
        <div class="rs-tile-text">
          <div class="rs-tile-title">I employ farm workers</div>
          <div class="rs-tile-desc">Post jobs, find skilled workers and keep clear digital records</div>
        </div>
        <q-icon name="arrow_forward_ios" size="13px" color="grey-5" class="rs-tile-arrow" />
      </div>

    </div>

    <div class="rs-footer">Kuluri · v0.1</div>

  </div>
</template>

<style scoped>
.rs-screen {
  min-height: 100vh;
  background: var(--page-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 40px;
}

/* Logo */
.rs-logo {
  margin-top: 72px;
  margin-bottom: 48px;
}

/* Headline */
.rs-question {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--text);
  text-align: center;
  margin-bottom: 10px;
}
.rs-hint {
  font-size: 14px;
  color: var(--muted);
  text-align: center;
  margin-bottom: 40px;
}

/* Option tiles */
.rs-tiles {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rs-tile {
  background: var(--surface);
  border-radius: 20px;
  padding: 20px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  border: 1.5px solid transparent;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s;
}
.rs-tile:active {
  border-color: var(--sage);
  box-shadow: var(--shadow-md);
  transform: scale(0.985);
}

.rs-tile-icon {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rs-tile-icon--worker { background: var(--sage-soft); }
.rs-tile-icon--farmer { background: var(--teal-soft); }

.rs-tile-text { flex: 1; min-width: 0; }
.rs-tile-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}
.rs-tile-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}

.rs-tile-arrow { flex-shrink: 0; }

/* Footer */
.rs-footer {
  margin-top: auto;
  padding-top: 32px;
  font-size: 11px;
  color: var(--muted);
  text-align: center;
}
</style>
