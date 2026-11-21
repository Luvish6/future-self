import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { cx } from './ui'
import { ThemeDot } from './ThemePicker'
import { useCollection } from '../lib/store'
import { themeOf } from '../lib/worlds'
import { assetUrl } from '../lib/util'

export const NAV: { to: string; label: string; icon: IconName; primary?: boolean }[] = [
  { to: '/', label: 'Today', icon: 'home', primary: true },
  { to: '/goals', label: 'Goals', icon: 'target', primary: true },
  { to: '/advisor', label: 'Advisor', icon: 'compass', primary: true },
  { to: '/habits', label: 'Habits', icon: 'check', primary: true },
  { to: '/simulate', label: 'Simulator', icon: 'sparkle' },
  { to: '/visualize', label: 'Visualize', icon: 'eye' },
  { to: '/affirmations', label: 'Affirmations', icon: 'sparkle' },
  { to: '/audio', label: 'Night audio', icon: 'moon' },
  { to: '/journal', label: 'Journal', icon: 'book' },
  { to: '/routine', label: 'Routine', icon: 'clock' },
  { to: '/vision', label: 'Vision board', icon: 'image' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
  { to: '/learn', label: 'The science', icon: 'star' },
  { to: '/settings', label: 'Settings & privacy', icon: 'settings' },
]

export function Layout() {
  const { pathname } = useLocation()
  const goals = useCollection('goals').rows.filter((g) => g.status === 'active')
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return (
    <div className="md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/50 px-3 py-6 backdrop-blur md:flex">
        <div className="mb-6 flex items-center gap-2 px-3">
          <img src={assetUrl('/icon.svg')} alt="" className="size-8" />
          <span className="leading-tight"><span className="block font-serif text-xl font-semibold">Future Self</span><span className="block text-xs text-muted">by Luvish</span></span>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] transition', isActive ? 'bg-accent-soft text-accent font-medium' : 'text-muted hover:bg-surface-2 hover:text-ink')}>
              <Icon name={n.icon} className="size-[18px]" /> {n.label}
            </NavLink>
          ))}
          <p className="px-3 pb-1 pt-5 text-xs font-medium uppercase tracking-wider text-muted">Goal worlds</p>
          {goals.map((g) => (
            <NavLink key={g.id} to={`/g/${g.id}`}
              className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] transition', isActive ? 'bg-accent-soft text-accent font-medium' : 'text-muted hover:bg-surface-2 hover:text-ink')}>
              <ThemeDot theme={themeOf(g)} /> <span className="truncate">{g.title}</span>
            </NavLink>
          ))}
          <NavLink to="/goals/new" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] text-muted hover:bg-surface-2 hover:text-ink"><Icon name="plus" className="size-[18px]" /> New goal</NavLink>
        </nav>
      </aside>

      <main id="main" className="min-h-dvh flex-1"><Outlet /></main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-lg justify-around">
          {[...NAV.filter((n) => n.primary), { to: '/more', label: 'More', icon: 'more' as IconName }].map((n) => (
            <li key={n.to} className="flex-1">
              <NavLink to={n.to} end={n.to === '/'}
                className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium', isActive ? 'text-accent' : 'text-muted')}>
                <Icon name={n.icon} className="size-[22px]" /> {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
