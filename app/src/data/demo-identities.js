// Demo identities for the prototype.
//
// The prototype has no accounts: Privy runs in mock-auth mode (any address,
// any code) and Supabase is optional. This table only decides which side of
// the app a known demo address lands on, so a live demo skips the role picker.
// It grants nothing — there is no admin role, and nothing here is a credential.

export const DEMO_IDENTITIES = {
  'angulo.linda@gmail.com': { role: 'farmer', name: 'Linda Angulo López' },
  'demo@kuluri.eu':         { role: 'farmer', name: 'Demo Farm' },
  'worker@kuluri.eu':       { role: 'worker', name: 'Demo Worker' },
}

const emailOf = (user) => {
  if (!user) return null
  const linked = user.linked_accounts ?? user.linkedAccounts ?? []
  const acc = linked.find((a) => a.type === 'email' || a.type === 'google_oauth')
  return (acc?.address ?? user.email?.address ?? user.google?.email ?? '').toLowerCase() || null
}

/** The demo identity for a Privy user, or null if the address is not a known one. */
export function demoIdentityFor(user) {
  const email = emailOf(user)
  return email ? (DEMO_IDENTITIES[email] ?? null) : null
}

export { emailOf }
