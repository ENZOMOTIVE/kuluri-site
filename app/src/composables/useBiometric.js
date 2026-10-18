// Device biometric / PIN consent before agreement signing.
// On real Android with enrolled biometric: surfaces native BiometricPrompt.
// On emulator or unenrolled device: shows in-app PIN dialog (demo consent).
import { useQuasar } from 'quasar'

export function useBiometric() {
  const $q = useQuasar()

  async function confirmWithDevice(reason = 'Confirm signing') {
    const isNative = typeof window !== 'undefined'
      && typeof window.Capacitor !== 'undefined'
      && window.Capacitor.isNativePlatform?.()

    if (isNative) {
      try {
        const { BiometricAuth } = await import('capacitor-biometric-authentication')

        // Check if biometric is actually available and enrolled before prompting
        const check = await BiometricAuth.checkBiometry()
        const available = check?.isAvailable && check?.biometryType !== 'none' && check?.strongBiometryIsAvailable

        if (!available) {
          // Emulator or device with no enrolled biometric → in-app PIN
          return _pinFallback($q, reason)
        }

        await BiometricAuth.authenticate({
          reason,
          title: 'Confirm agreement',
          subtitle: 'Use your biometric or device PIN to sign',
          cancelTitle: 'Cancel',
          allowDeviceCredential: true,
        })
        return true
      } catch (e) {
        const msg = (e?.message ?? '').toLowerCase()
        const code = e?.code ?? ''
        if (code === 'USER_CANCELED' || msg.includes('cancel')) return false
        return _pinFallback($q, reason)
      }
    }

    // Browser / web
    return _pinFallback($q, reason)
  }

  return { confirmWithDevice }
}

function _pinFallback($q, reason) {
  return new Promise((resolve) => {
    $q.dialog({
      title: 'Confirm signing',
      message: 'Enter your PIN to confirm you agree to this contract.',
      prompt: { model: '', type: 'password', label: 'PIN (any 4+ digits)', maxlength: 8 },
      cancel: { flat: true, noCaps: true, label: 'Cancel' },
      ok: { unelevated: true, noCaps: true, color: 'primary', label: 'Confirm & Sign' },
    })
      .onOk((pin) => resolve(pin?.length >= 4))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  })
}
