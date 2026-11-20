import { useState } from 'react'
import { Button, Card, Chip, Empty, Field, IconButton, Notice, Page, Section, cx } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { useHabitLogs } from '../../lib/hooks'
import { HABIT_LIBRARY } from '../../lib/engine/categorize'
import { completionRate, flexibleStreak, isScheduled, recoveryMessage } from '../../lib/engine/streaks'
import type { Habit } from '../../lib/types'
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

  const cat = goals[0]?.category ?? 'general'
  const ideas = HABIT_LIBRARY[cat].filter((h) => !rows.some((r) => r.title === h.title))
  const challenge = ideas.length ? pick(ideas, hash(dayKey())) : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form?.title?.trim()) return
    await save({ ...form, title: cleanText(form.title, 200), cue: cleanText(form.cue ?? '', 300), minutes: Math.max(1, Math.min(240, form.minutes ?? 5)) })
    setForm(null)
  }

  return (
    <Page title="Habits" subtitle="Small actions that build evidence for your new identity."
      actions={!form && <Button icon="plus" onClick={() => setForm({ ...blank(), goal_id: goals[0]?.id ?? null })}>New</Button>}>
      {form && (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Habit">{(id) => <input id={id} className="field" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Read 10 pages" />}</Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <Field label="Cue (when/where)" hint="Implementation intention: “After I ___, I will ___.”">{(id) => <input id={id} className="field" maxLength={300} value={form.cue} onChange={(e) => setForm({ ...form, cue: e.target.value })} placeholder="After morning coffee" />}</Field>
              <Field label="Minutes">{(id) => <input id={id} type="number" min={1} max={240} className="field" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })} />}</Field>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Days <span className="font-normal text-muted">(none selected = every day)</span></p>
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button key={i} type="button" aria-pressed={form.days?.includes(i)} aria-label={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}
                    onClick={() => setForm({ ...form, days: form.days?.includes(i) ? form.days.filter((x) => x !== i) : [...(form.days ?? []), i].sort() })}
                    className={cx('size-9 rounded-full border text-sm', form.days?.includes(i) ? 'border-accent bg-accent text-accent-ink' : 'border-line text-muted')}>{d}</button>
                ))}
              </div>
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
            <Button size="sm" variant="ghost" icon="plus" onClick={() => save({ ...blank(), title: challenge.title, minutes: challenge.minutes, goal_id: goals[0]?.id ?? null })}>Make it a habit</Button>
          </div>
        </Card>
      )}

      {rows.length === 0 && !form ? (
        <Empty icon="check" title="No habits yet">Start with one tiny habit — two minutes is enough to begin.</Empty>
      ) : (
        <Section title="Your habits">
          <ul className="space-y-3">
            {rows.map((h) => {
              const done = byHabit.get(h.id) ?? new Set<string>()
              const since = h.created_at.slice(0, 10)
              const { streak, graceUsed } = flexibleStreak(done, h.days, today, since)
              const rate = completionRate(done, h.days, 30, today, since)
              const recovery = h.active ? recoveryMessage(done, h.days, today, since) : null
              return (
                <Card as="li" key={h.id} className={h.active ? '' : 'opacity-60'}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{h.title}</p>
                      <p className="text-xs text-muted">{[h.cue, `${h.minutes} min`, h.days.length ? h.days.map((d) => DAYS[d]).join(' ') : 'daily'].filter(Boolean).join(' · ')}</p>
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
                      <p><span className="font-serif text-lg text-ink">{streak}</span> day streak{graceUsed && ' (with a rest day)'}</p>
                      <p>{Math.round(rate * 100)}% last 30 days</p>
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
