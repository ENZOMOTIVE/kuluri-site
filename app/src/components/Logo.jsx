// Kuluri wordmark: a leaf in a rounded square, in the muted sage accent.
export default function Logo({ size = 28, text = true }) {
  return (
    <span className="logo" style={{ gap: size * 0.32 }}>
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--mantine-color-brand-7)" />
        <path d="M9 23c0-8 5.5-13.5 14-13.5C22 18 17 23 9 23z" fill="var(--surface)" />
        <path d="M9 23l7.5-7.5" stroke="var(--mantine-color-brand-7)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {text && (
        <span className="logo-word" style={{ fontSize: size * 0.8, color: 'var(--mantine-color-text)' }}>
          kuluri
        </span>
      )}
    </span>
  )
}
