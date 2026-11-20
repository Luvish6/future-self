export type Theme = 'light' | 'dark' | 'system'
const KEY = 'fs:theme'

export function getTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme) || 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(t: Theme = getTheme()) {
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t)
  } catch { /* private mode */ }
  applyTheme(t)
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => getTheme() === 'system' && applyTheme())
}
