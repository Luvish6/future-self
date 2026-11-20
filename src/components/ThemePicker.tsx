import { WORLD_THEMES } from '../lib/worlds'
import type { WorldTheme } from '../lib/types'
import { cx } from './ui'

export function ThemeDot({ theme, className = 'size-3' }: { theme: WorldTheme; className?: string }) {
  const t = WORLD_THEMES.find((x) => x.value === theme) ?? WORLD_THEMES[0]
  return <span aria-hidden="true" className={cx('inline-block shrink-0 rounded-full', className)} style={{ background: `linear-gradient(135deg, ${t.light.accent}, ${t.light.warm})` }} />
}

export function ThemePicker({ value, onChange }: { value: WorldTheme; onChange: (t: WorldTheme) => void }) {
  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex flex-wrap gap-2">
      {WORLD_THEMES.map((t) => (
        <button key={t.value} type="button" role="radio" aria-checked={value === t.value} onClick={() => onChange(t.value)}
          className={cx('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition', value === t.value ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:text-ink')}>
          <ThemeDot theme={t.value} className="size-4" /> {t.label}
        </button>
      ))}
    </div>
  )
}
