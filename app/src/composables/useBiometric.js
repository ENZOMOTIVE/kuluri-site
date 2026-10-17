// Device biometric / PIN consent before agreement signing.
// On real Android: surfaces the native BiometricPrompt (fingerprint, face, or device PIN).
// On emulator / web: falls back to a simple in-app PIN dialog (demo only).
import { useQuasar } from 'quasar'

export function useBiometric() {
  const $q = useQuasar()

  async function confirmWithDevice(reason = 'Confirm signing') {
    // Try native Capacitor biometric
    const isNative = typeof window !== 'undefined'
      && typeof window.Capacitor !== 'undefined'
      && window.Capacitor.isNativePlatform?.()

    if (isNative) {
      try {
        const { BiometricAuth } = await import('capacitor-biometric-authentication')
        await BiometricAuth.authenticate({
          reason,
          title: 'Confirm agreement',
          subtitle: 'Use your device PIN or biometric to sign',
          cancelTitle: 'Cancel',
          allowDeviceCredential: true,
        })
        return true
      } catch (e) {
        const msg = (e?.message ?? '').toLowerCase()
        const code = e?.code ?? ''
        // Explicit user cancel — do not proceed
        if (code === 'USER_CANCELED' || msg.includes('cancel')) return false
        // Everything else (not enrolled, emulator, hardware missing) → in-app PIN
        return _pinFallback($q, reason)
      }
    }

    // Emulator / browser fallback
    return _pinFallback($q, reason)
  }

  return { confirmWithDevice }
}

// Simple 4-digit PIN dialog — emulator / browser only, not cryptographically secure
function _pinFallback($q, reason) {
  return new Promise((resolve) => {
    $q.dialog({
      title: 'Confirm signing',
      message: reason + '\n\nEnter your device PIN to continue.',
      prompt: { model: '', type: 'password', label: 'PIN', maxlength: 8 },
      cancel: { flat: true, noCaps: true, label: 'Cancel' },
      ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Confirm' },
    })
      .onOk((pin) => resolve(pin?.length >= 4)) // any 4+ char input passes in demo
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  })
}
