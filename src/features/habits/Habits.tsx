import { useState } from 'react'
import { Button, Card, Chip, Empty, Field, IconButton, Notice, Page, Section, Segmented, cx } from '../../components/ui'
import { GoalScopeBar, useGoalScope } from '../../components/GoalScope'
import { PRESETS } from '../../content/worlds'
import { Icon } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { useHabitLogs } from '../../lib/hooks'
import { CATEGORY_LABEL, HABIT_LIBRARY } from '../../lib/engine/categorize'
import { completionRate, flexibleStreak, isScheduled, recoveryMessage, weekCount, weeklyRate, weeklyStreak } from '../../lib/engine/streaks'
import type { Category, Habit } from '../../lib/types'
import { addDays, cleanText, dayKey, hash, pick } from '../../lib/util'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const blank = (): Partial<Habit> => ({ title: '', cue: '', minutes: 5, days: [], active: true, goal_id: null })

export default function Habits() {
  const { rows, save, remove } = useCollection('habits')
  const goals = useCollection('goals').rows.filter((g) => g.status === 'active')
  const journal = useCollection('journal_entries')
  const { byHabit, toggle } = useHabitLogs()
  const [form, setForm] = useState<Partial<Habit> | null>(null)
  const [challengeDone, setChallengeDone] = useState(false)
  const today = new Date()
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))

  const scope = useGoalScope()
  const list = scope.goal ? rows.filter((h) => h.goal_id === scope.goal!.id) : rows
  const defaultGoal = scope.goal?.id ?? goals[0]?.id ?? null
  const cat = scope.goal?.category ?? goals[0]?.category ?? 'general'
  const [libCat, setLibCat] = useState<Category | null>(null)
  const lib = HABIT_LIBRARY[libCat ?? cat].filter((h) => !list.some((r) => r.title === h.title))
  const ideas = HABIT_LIBRARY[cat].filter((h) => !rows.some((r) => r.title === h.title))
  const mode = form?.weekly_target ? 'weekly' : form?.days?.length ? 'days' : 'daily'
  const challenge = ideas.length ? pick(ideas, hash(dayKey())) : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form?.title?.trim()) return
    await save({ ...form, title: cleanText(form.title, 200), cue: cleanText(form.cue ?? '', 300), minutes: Math.max(1, Math.min(240, form.minutes ?? 5)) })
    setForm(null)
  }

  return (
    <Page title="Habits" subtitle="Small actions that build evidence for your new identity."
      actions={!form && <Button icon="plus" onClick={() => setForm({ ...blank(), goal_id: defaultGoal })}>New</Button>}>
      <GoalScopeBar scope={scope} />
      {form && (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Habit">{(id) => <input id={id} className="field" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Read 10 pages" />}</Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <Field label="Cue (when/where)" hint="Implementation intention: “After I ___, I will ___.”">{(id) => <input id={id} className="field" maxLength={300} value={form.cue} onChange={(e) => setForm({ ...form, cue: e.target.value })} placeholder="After morning coffee" />}</Field>
              <Field label="Minutes">{(id) => <input id={id} type="number" min={1} max={240} className="field" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })} />}</Field>
            </div>
            <div className="space-y-3">
              <Segmented label="Schedule" value={mode} onChange={(m) => setForm({ ...form, ...(m === 'daily' ? { days: [], weekly_target: null } : m === 'days' ? { weekly_target: null, days: form.days?.length ? form.days : [1, 3, 5] } : { days: [], weekly_target: form.weekly_target || 3 }) })}
                options={[{ value: 'daily', label: 'Every day' }, { value: 'days', label: 'Specific days' }, { value: 'weekly', label: 'Times per week' }]} />
              {mode === 'weekly' && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="number" min={1} max={7} className="field w-20" value={form.weekly_target ?? 3} onChange={(e) => setForm({ ...form, weekly_target: Math.max(1, Math.min(7, Number(e.target.value) || 1)) })} /> times a week, on any days
                </label>
              )}
              {mode === 'days' && <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button key={i} type="button" aria-pressed={form.days?.includes(i)} aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}
                    onClick={() => setForm({ ...form, days: form.days?.includes(i) ? form.days.filter((x) => x !== i) : [...(form.days ?? []), i].sort() })}
                    className={cx('size-9 rounded-full border text-sm', form.days?.includes(i) ? 'border-accent bg-accent text-accent-ink' : 'border-line text-muted')}>{d}</button>
                ))}
              </div>}
            </div>
            {goals.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Linked goal">
                {goals.map((g) => <Chip key={g.id} active={form.goal_id === g.id} onClick={() => setForm({ ...form, goal_id: g.id })}>{g.title}</Chip>)}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit">Save habit</Button>
            </div>
          </form>
        </Card>
      )}

      {challenge && (
        <Card className="bg-gradient-to-br from-accent-soft to-surface">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">Today’s optional challenge</p>
          <p className="mt-1 text-lg font-medium">{challenge.title}</p>
          <p className="text-sm text-muted">About {challenge.minutes} min. Skip it freely — challenges are invitations, not obligations.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" icon="check" disabled={challengeDone} onClick={async () => {
              await journal.save({ kind: 'win', title: 'Daily challenge', body: `Completed: ${challenge.title}`, mood: null, open_on: null })
              setChallengeDone(true)
            }}>{challengeDone ? 'Logged as a win' : 'I did it'}</Button>
            <Button size="sm" variant="ghost" icon="plus" onClick={() => save({ ...blank(), title: challenge.title, minutes: challenge.minutes, goal_id: defaultGoal })}>Make it a habit</Button>
          </div>
        </Card>
      )}

      <Section title="Habit library" action={scope.goal && <span className="text-xs text-muted">Adds to “{scope.goal.title}”</span>}>
        <div role="group" aria-label="Library category" className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {PRESETS.map((p) => <Chip key={p.category} active={(libCat ?? cat) === p.category} onClick={() => setLibCat(p.category)}><span className="whitespace-nowrap">{CATEGORY_LABEL[p.category]}</span></Chip>)}
        </div>
        {lib.length === 0 ? <p className="text-sm text-muted">You’ve added everything from this category — create a custom habit with New.</p> : (
          <ul className="space-y-2">
            {lib.map((h) => (
              <li key={h.title} className="flex items-center gap-2 rounded-xl bg-surface-2/60 px-4 py-2.5 text-sm">
                <span className="flex-1">{h.title} <span className="text-muted">· {h.minutes} min</span></span>
                <Button size="sm" variant="soft" icon="plus" onClick={() => save({ title: h.title, minutes: h.minutes, cue: '', days: [], weekly_target: null, active: true, goal_id: defaultGoal })}>Add</Button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {list.length === 0 && !form ? (
        <Empty icon="check" title="No habits yet">Start with one tiny habit — two minutes is enough to begin.</Empty>
      ) : (
        <Section title="Your habits">
          <ul className="space-y-3">
            {list.map((h) => {
              const done = byHabit.get(h.id) ?? new Set<string>()
              const since = h.created_at.slice(0, 10)
              const { streak, graceUsed } = flexibleStreak(done, h.days, today, since)
              const rate = completionRate(done, h.days, 30, today, since)
              const wt = h.weekly_target ?? 0
              const recovery = h.active && !wt ? recoveryMessage(done, h.days, today, since) : null
              return (
                <Card as="li" key={h.id} className={h.active ? '' : 'opacity-60'}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{h.title}</p>
                      <p className="text-xs text-muted">{[h.cue, `${h.minutes} min`, wt ? `${wt}× per week` : h.days.length ? h.days.map((d) => DAYS[d]).join(' ') : 'daily'].filter(Boolean).join(' · ')}</p>
                    </div>
                    <IconButton icon="edit" label="Edit habit" onClick={() => setForm(h)} />
                    <IconButton icon={h.active ? 'pause' : 'play'} label={h.active ? 'Pause habit' : 'Resume habit'} onClick={() => save({ id: h.id, active: !h.active })} />
                    <IconButton icon="trash" label="Delete habit" onClick={() => confirm(`Delete “${h.title}”?`) && remove(h.id)} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div className="flex gap-1.5">
                      {week.map((d) => {
                        const k = dayKey(d)
                        const on = done.has(k)
                        const sched = isScheduled(h.days, d)
                        return (
                          <button key={k} type="button" onClick={() => toggle(h.id, k)} aria-pressed={on}
                            aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long' })}: ${on ? 'done' : 'not done'}`}
                            className={cx('flex size-9 flex-col items-center justify-center rounded-xl border text-[10px] transition',
                              on ? 'border-ok bg-ok text-white' : sched ? 'border-line text-muted hover:border-accent' : 'border-transparent text-muted/50')}>
                            {on ? <Icon name="check" className="size-4" /> : DAYS[d.getDay()]}
                          </button>
                        )
                      })}
                    </div>
                    <div className="text-right text-xs text-muted">
                      {wt ? (
                        <>
                          <p><span className="font-serif text-lg text-ink">{weekCount(done, today)}/{wt}</span> this week</p>
                          <p>{weeklyStreak(done, wt, today, since)} week streak · {Math.round(weeklyRate(done, wt, today, 4, since) * 100)}% of target</p>
                        </>
                      ) : (
                        <>
                          <p><span className="font-serif text-lg text-ink">{streak}</span> day streak{graceUsed && ' (with a rest day)'}</p>
                          <p>{Math.round(rate * 100)}% last 30 days</p>
                        </>
                      )}
                    </div>
                  </div>
                  {recovery && <p className="mt-3 text-sm text-muted">{recovery}</p>}
                </Card>
              )
            })}
          </ul>
        </Section>
      )}
      <Notice>Streaks here forgive a single missed day. What matters is returning, not perfection — research on habit formation suggests occasional misses don’t derail long-term progress.</Notice>
    </Page>
  )
}
