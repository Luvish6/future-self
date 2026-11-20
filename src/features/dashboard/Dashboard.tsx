import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Card, Empty, Page, Progress, Section, cx } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { useHabitLogs, useProfile } from '../../lib/hooks'
import { isScheduled, flexibleStreak } from '../../lib/engine/streaks'
import { addDays, dayKey, greeting, hash, pick } from '../../lib/util'
import { themeOf } from '../../lib/worlds'
import { CATEGORY_LABEL } from '../../lib/engine/categorize'

const QUICK: { to: string; label: string; icon: IconName; hint: string }[] = [
  { to: '/visualize', label: 'Rehearse', icon: 'eye', hint: 'Visualization' },
  { to: '/advisor', label: 'Ask', icon: 'compass', hint: 'Future Self Advisor' },
  { to: '/journal', label: 'Reflect', icon: 'book', hint: 'Journal' },
  { to: '/audio', label: 'Wind down', icon: 'moon', hint: 'Night audio' },
]

export default function Dashboard() {
  const { profile, loading } = useProfile()
  const goals = useCollection('goals').rows.filter((g) => g.status === 'active')
  const habits = useCollection('habits').rows.filter((h) => h.active)
  const affirmations = useCollection('affirmations').rows
  const journal = useCollection('journal_entries').rows
  const sessions = useCollection('audio_sessions').rows
  const { byHabit, toggle, doneOn } = useHabitLogs()

  const today = new Date()
  const todays = habits.filter((h) => isScheduled(h.days, today))
  const doneCount = todays.filter((h) => doneOn(h.id)).length
  const affirmation = affirmations.length ? pick(affirmations, hash(dayKey())) : null
  const lastEntry = [...journal].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const goal = goals[0]
  const weekStart = dayKey(addDays(today, -6))
  const week = useMemo(() => ({
    habits: [...byHabit.values()].reduce((n, s) => n + [...s].filter((d) => d >= weekStart).length, 0),
    entries: journal.filter((j) => j.created_at.slice(0, 10) >= weekStart).length,
    minutes: Math.round(sessions.filter((s) => s.created_at.slice(0, 10) >= weekStart).reduce((n, s) => n + s.duration_s, 0) / 60),
  }), [byHabit, journal, sessions, weekStart])

  if (loading) return null
  const name = profile?.display_name ? `, ${profile.display_name}` : ''

  if (!profile?.onboarding) {
    return (
      <Page title={`${greeting()}${name}`} subtitle="Let’s design the person you’re becoming.">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-[color-mix(in_oklab,var(--accent)_70%,var(--warm))] p-6 text-accent-ink md:p-10">
          <div className="absolute -right-10 -top-10 size-48 rounded-full bg-accent-ink/10 blur-2xl" />
          <h2 className="text-2xl md:text-3xl">Meet your future self</h2>
          <p className="mt-2 max-w-md text-accent-ink/90">Answer a few reflective questions (about 5 minutes). We’ll turn them into a realistic growth plan with small daily actions, an identity statement, and if-then plans for your obstacles.</p>
          <Link to="/onboarding" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium text-[#1f1d2b]">Begin <Icon name="arrow" className="size-4" /></Link>
        </div>
        <p className="text-sm text-muted">Your answers stay private on this device unless you choose to sign in and sync. Future Self is a personal-development tool, not a substitute for professional care.</p>
      </Page>
    )
  }

  return (
    <Page title={`${greeting()}${name}`} subtitle={today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}>
      {goal?.identity_statement && (
        <Card className="bg-gradient-to-br from-accent-soft to-surface">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">Who you’re becoming</p>
          <p className="mt-1 font-serif text-xl leading-snug">{goal.identity_statement}</p>
        </Card>
      )}

      <Section title="Your goal worlds" action={<Link to="/goals/new" className="text-sm text-accent">+ New goal</Link>}>
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:px-0">
          {goals.map((g) => (
            <li key={g.id} data-world={themeOf(g)} className="w-60 shrink-0 snap-start md:w-auto">
              <Link to={`/g/${g.id}`} className="block h-full rounded-2xl bg-gradient-to-br from-accent to-[color-mix(in_oklab,var(--accent)_70%,var(--warm))] p-4 text-accent-ink transition hover:brightness-105">
                <span className="text-xs text-accent-ink/80">{CATEGORY_LABEL[g.category]}</span>
                <span className="mt-1 block font-serif text-lg leading-snug">{g.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Today’s actions" action={<Link to="/habits" className="text-sm text-accent">Manage</Link>}>
        {todays.length === 0 ? (
          <Empty icon="check" title="No actions for today" action={<Link className="text-accent" to="/habits">Add a small habit</Link>} />
        ) : (
          <Card className="p-2 md:p-2">
            <div className="flex items-center justify-between px-3 pb-2 pt-2 text-sm text-muted">
              <span>{doneCount} of {todays.length} done</span>
              <span className="w-24"><Progress value={doneCount / todays.length} label="Today’s progress" /></span>
            </div>
            <ul>
              {todays.map((h) => {
                const done = doneOn(h.id)
                const { streak } = flexibleStreak(byHabit.get(h.id) ?? new Set(), h.days, today, h.created_at.slice(0, 10))
                return (
                  <li key={h.id}>
                    <button type="button" onClick={() => toggle(h.id)} aria-pressed={done}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-2">
                      <span className={cx('grid size-7 shrink-0 place-items-center rounded-full border-2 transition', done ? 'border-ok bg-ok text-white' : 'border-line')}>
                        {done && <Icon name="check" className="size-4" />}
                      </span>
                      <span className="flex-1">
                        <span className={cx('block', done && 'text-muted line-through')}>{h.title}</span>
                        <span className="text-xs text-muted">{h.cue ? `${h.cue} · ` : ''}{h.minutes} min</span>
                      </span>
                      {streak > 1 && !h.weekly_target && <span className="text-xs text-muted">{streak} days</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="group rounded-2xl border border-line bg-surface/80 p-4 transition hover:border-accent">
            <Icon name={q.icon} className="size-6 text-accent" />
            <p className="mt-3 font-medium">{q.label}</p>
            <p className="text-xs text-muted">{q.hint}</p>
          </Link>
        ))}
      </div>

      {affirmation && (
        <Section title="Today’s affirmation">
          <Card><p className="font-serif text-lg leading-relaxed">“{affirmation.text}”</p></Card>
        </Section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {goal && (
          <Section title="Active goal" action={<Link to="/goals" className="text-sm text-accent">All goals</Link>}>
            <Card>
              <p className="font-medium">{goal.title}</p>
              {goal.milestones.length > 0 && (
                <>
                  <div className="mt-3"><Progress value={goal.milestones.filter((m) => m.done).length / goal.milestones.length} label="Milestones" /></div>
                  <p className="mt-2 text-xs text-muted">{goal.milestones.filter((m) => m.done).length}/{goal.milestones.length} milestones · next: {goal.milestones.find((m) => !m.done)?.title ?? 'all done 🎉'}</p>
                </>
              )}
            </Card>
          </Section>
        )}
        <Section title="This week">
          <Card className="grid grid-cols-3 text-center">
            {[[week.habits, 'actions done'], [week.entries, 'reflections'], [week.minutes, 'audio minutes']].map(([n, l]) => (
              <div key={l as string}><p className="font-serif text-2xl">{n}</p><p className="text-xs text-muted">{l}</p></div>
            ))}
          </Card>
        </Section>
      </div>

      {lastEntry && (
        <Section title="Recent reflection" action={<Link to="/journal" className="text-sm text-accent">Journal</Link>}>
          <Card>
            <p className="text-xs text-muted">{new Date(lastEntry.created_at).toLocaleDateString()}</p>
            <p className="mt-1 line-clamp-3">{lastEntry.open_on && lastEntry.open_on > dayKey() ? '🔒 Sealed letter to your future self' : lastEntry.body}</p>
          </Card>
        </Section>
      )}
    </Page>
  )
}
