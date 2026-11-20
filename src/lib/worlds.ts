import type { Category, WorldTheme } from './types'

/** Token overrides per Goal World. Neutral = base tokens in index.css. Single source for CSS + contrast tests. */
export interface Palette { accent: string; accentSoft: string; accentInk: string; warm: string; glow1: string; glow2: string }

export const BASE: Record<'light' | 'dark', Palette & { bg: string; surface: string }> = {
  light: { bg: '#f7f5f2', surface: '#ffffff', accent: '#5e4cc4', accentSoft: '#ece8fb', accentInk: '#ffffff', warm: '#c9774f', glow1: '#ece7fb', glow2: '#fbe9df' },
  dark: { bg: '#14131a', surface: '#1c1b24', accent: '#a596f7', accentSoft: '#2a2645', accentInk: '#15131f', warm: '#e9a07a', glow1: '#221d3a', glow2: '#2a1c19' },
}

export const WORLD_THEMES: { value: WorldTheme; label: string; light: Palette; dark: Palette }[] = [
  { value: 'neutral', label: 'Balanced', light: BASE.light, dark: BASE.dark },
  {
    value: 'love', label: 'Rose & cream',
    light: { accent: '#b0365c', accentSoft: '#fbe6ec', accentInk: '#ffffff', warm: '#d9825b', glow1: '#fbe3ea', glow2: '#fdeee2' },
    dark: { accent: '#f29bb4', accentSoft: '#3a2230', accentInk: '#1f1218', warm: '#f0b08f', glow1: '#3a1f2b', glow2: '#2e2219' },
  },
  {
    value: 'confidence', label: 'Gold & lavender',
    light: { accent: '#6b3fa0', accentSoft: '#efe6fa', accentInk: '#ffffff', warm: '#b8860b', glow1: '#ece4fb', glow2: '#fbf1d9' },
    dark: { accent: '#c3a3f0', accentSoft: '#2c2342', accentInk: '#17111f', warm: '#e2b955', glow1: '#261d3d', glow2: '#2b2414' },
  },
  {
    value: 'finance', label: 'Emerald & gold',
    light: { accent: '#1d7350', accentSoft: '#e3f3ea', accentInk: '#ffffff', warm: '#b08d3c', glow1: '#e4f1e8', glow2: '#f6efdc' },
    dark: { accent: '#6fd1a1', accentSoft: '#19302a', accentInk: '#0f1d16', warm: '#d8b86a', glow1: '#15291f', glow2: '#29251a' },
  },
  {
    value: 'peace', label: 'Sage & sky',
    light: { accent: '#46705d', accentSoft: '#e6efe9', accentInk: '#ffffff', warm: '#7fa6c4', glow1: '#e8f0ea', glow2: '#e6eff6' },
    dark: { accent: '#9cc8b2', accentSoft: '#1f2d27', accentInk: '#101a15', warm: '#9fc1db', glow1: '#18261f', glow2: '#172330' },
  },
  {
    value: 'career', label: 'Navy & teal',
    light: { accent: '#1f4e79', accentSoft: '#e3ecf5', accentInk: '#ffffff', warm: '#2a9d8f', glow1: '#e4ebf3', glow2: '#e1f1ef' },
    dark: { accent: '#8db8e3', accentSoft: '#1b2838', accentInk: '#0e1520', warm: '#5cc3b6', glow1: '#16202e', glow2: '#13272a' },
  },
]

/** Suggested (not forced) palette for a category; users can change it per goal. */
export function defaultTheme(c: Category): WorldTheme {
  switch (c) {
    case 'love': case 'self_love': case 'relationships': return 'love'
    case 'confidence': case 'creativity': return 'confidence'
    case 'finance': return 'finance'
    case 'peace': case 'health': return 'peace'
    case 'career': case 'academic': case 'productivity': case 'learning': return 'career'
    default: return 'neutral'
  }
}

export const themeOf = (g: { theme?: WorldTheme; category: Category }) => g.theme ?? defaultTheme(g.category)

// ---- WCAG contrast ----
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const vars = (p: Palette) =>
  `--accent:${p.accent};--accent-soft:${p.accentSoft};--accent-ink:${p.accentInk};--warm:${p.warm};--bg-glow-1:${p.glow1};--bg-glow-2:${p.glow2};`

/** CSS for `[data-world="x"]` scopes (works on <html> or any wrapper), light + dark. */
export function worldCss(): string {
  return WORLD_THEMES.filter((t) => t.value !== 'neutral')
    .map((t) => {
      const sel = `[data-world="${t.value}"]`
      return `${sel}{${vars(t.light)}}.dark ${sel},.dark${sel}{${vars(t.dark)}}`
    })
    .join('\n')
}

export function injectWorldCss() {
  if (typeof document === 'undefined' || document.getElementById('world-themes')) return
  const el = document.createElement('style')
  el.id = 'world-themes'
  el.textContent = worldCss()
  document.head.appendChild(el)
}
