import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, Empty, Page, Progress, Section, cx } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { setActiveGoal, useHabitLogs } from '../../lib/hooks'
import { CATEGORY_LABEL } from '../../lib/engine/categorize'
import { isScheduled } from '../../lib/engine/streaks'
import { useWorldTheme } from '../../components/GoalScope'
import { DailyExperience } from './Daily'

export function GoalSwitcher({ current }: { current?: string }) {
  const nav = useNavigate()
  const goals = useCollection('goals').rows.filter((g) => g.status !== 'done' || g.id === current)
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Switch goal</span>
      <select className="field w-auto max-w-[14rem] appearance-none py-1.5 pr-8 text-sm" value={current ?? ''}
        onChange={(e) => nav(e.target.value === 'new' ? '/goals/new' : `/g/${e.target.value}`)}>
        {!current && <option value="">Choose a goal…</option>}
        {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        <option value="new">+ New goal</option>
      </select>
      <Icon name="arrow" className="pointer-events-none absolute right-2.5 size-3.5 rotate-90 text-muted" />
    </label>
  )
}

const LINKS: { to: (id: string) => string; label: string; icon: IconName }[] = [
  { to: (id) => `/visualize?goal=${id}`, label: 'Visualize', icon: 'eye' },
  { to: (id) => `/advisor?goal=${id}`, label: 'Advisor', icon: 'compass' },
  { to: (id) => `/affirmations?goal=${id}`, label: 'Affirmations', icon: 'sparkle' },
  { to: (id) => `/vision?goal=${id}`, label: 'Vision board', icon: 'image' },
  { to: (id) => '/journal?goal=' + id, label: 'Journal', icon: 'book' },
  { to: (id) => '/journal?new=evidence&goal=' + id, label: 'Log evidence', icon: 'star' },
  { to: () => '/audio', label: 'Night audio', icon: 'moon' },
]

export default function World() {
  const { goalId = '' } = useParams()
  const goals = useCollection('goals')
  const goal = goals.rows.find((g) => g.id === goalId)
  const habits = useCollection('habits').rows.filter((h) => h.goal_id === goalId && h.active)
  const affs = useCollection('affirmations').rows.filter((a) => a.goal_id === goalId)
  const { toggle, doneOn } = useHabitLogs()
  useWorldTheme(goal)
  useEffect(() => { if (goal) setActiveGoal(goal.id) }, [goal])

  if (goals.loading) return null
  if (!goal) return <Page title="Goal not found" back="/goals"><Empty icon="target" title="This goal doesn’t exist anymore" action={<Link className="text-accent" to="/goals/new">Create a goal</Link>} /></Page>

  const today = new Date()
  const todays = habits.filter((h) => isScheduled(h.days, today))
  const ms = goal.milestones
  const msDone = ms.filter((m) => m.done).length

  return (
    <Page title={goal.title} subtitle={CATEGORY_LABEL[goal.category]} actions={<GoalSwitcher current={goal.id} />}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-[color-mix(in_oklab,var(--accent)_70%,var(--warm))] p-6 text-accent-ink md:p-8">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-accent-ink/10 blur-2xl" aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-wider text-accent-ink/80">Who you’re becoming</p>
        <p className="mt-1 max-w-xl font-serif text-2xl leading-snug">{goal.identity_statement || 'Add an identity statement to describe who you’re becoming.'}</p>
        {goal.description && <p className="mt-3 max-w-xl text-sm text-accent-ink/90">{goal.description}</p>}
        <Link to="/goals" className="mt-4 inline-flex items-center gap-1 text-sm text-accent-ink/90 underline-offset-4 hover:underline"><Icon name="edit" className="size-4" /> Edit goal</Link>
      </div>

      <DailyExperience goal={goal} />

      <Section title="Today’s actions">
        {todays.length === 0 ? <Empty icon="check" title="No habits for this goal today" action={<Link className="text-accent" to={`/habits?goal=${goal.id}`}>Add a habit</Link>} /> : (
          <Card className="p-2 md:p-2">
            <ul>
              {todays.map((h) => {
                const done = doneOn(h.id)
                return (
                  <li key={h.id}>
                    <button type="button" onClick={() => toggle(h.id)} aria-pressed={done} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface-2">
                      <span className={cx('grid size-7 shrink-0 place-items-center rounded-full border-2', done ? 'border-accent bg-accent text-accent-ink' : 'border-line')}>{done && <Icon name="check" className="size-4" />}</span>
                      <span className={cx('flex-1', done && 'text-muted line-through')}>{h.title}</span>
                      <span className="text-xs text-muted">{h.minutes} min</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </Section>

      {affs.length > 0 && (
        <Section title="Affirmations" action={<Link to={`/affirmations?goal=${goal.id}`} className="text-sm text-accent">Manage</Link>}>
          <ul className="space-y-2">
            {affs.slice(0, 3).map((a) => <Card as="li" key={a.id} className="py-3 font-serif text-lg md:py-3">{a.text}</Card>)}
          </ul>
        </Section>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
        {LINKS.map((l) => (
          <Link key={l.label} to={l.to(goal.id)} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface/80 p-3 text-center text-xs transition hover:border-accent">
            <Icon name={l.icon} className="size-5 text-accent" /> {l.label}
          </Link>
        ))}
      </div>

      {ms.length > 0 && (
        <Section title="Milestones">
          <Card>
            <Progress value={msDone / ms.length} label="Milestone progress" />
            <ul className="mt-3 space-y-1">
              {ms.map((m) => (
                <li key={m.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-sm hover:bg-surface-2">
                    <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={m.done}
                      onChange={() => goals.save({ id: goal.id, milestones: ms.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)) })} />
                    <span className={m.done ? 'text-muted line-through' : ''}>{m.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      {(goal.reflection_questions?.length ?? 0) > 0 && (
        <Section title="Reflect" action={<Link to="/journal" className="text-sm text-accent">Open journal</Link>}>
          <Card><ul className="list-disc space-y-1.5 pl-5">{goal.reflection_questions!.map((q) => <li key={q}>{q}</li>)}</ul></Card>
        </Section>
      )}
    </Page>
  )
}
