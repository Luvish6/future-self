import { Card, Empty, Page, Progress, Section } from '../../components/ui'
import { useCollection } from '../../lib/store'
import { useHabitLogs } from '../../lib/hooks'
import { completionRate, isScheduled } from '../../lib/engine/streaks'
import { addDays, dayKey } from '../../lib/util'

export default function ProgressPage() {
  const habits = useCollection('habits').rows.filter((h) => h.active)
  const goals = useCollection('goals').rows
  const journal = useCollection('journal_entries').rows
  const sessions = useCollection('audio_sessions').rows
  const { byHabit } = useHabitLogs()
  const today = new Date()

  // 35-day heatmap: share of scheduled habits completed per day.
  const days = Array.from({ length: 35 }, (_, i) => addDays(today, i - 34))
  const heat = days.map((d) => {
    const sched = habits.filter((h) => isScheduled(h.days, d))
    const k = dayKey(d)
    const done = sched.filter((h) => byHabit.get(h.id)?.has(k)).length
    return { d, k, v: sched.length ? done / sched.length : 0, label: `${d.toLocaleDateString()}: ${done}/${sched.length}` }
  })
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = dayKey(addDays(today, -7 * (8 - i) + 1)), end = dayKey(addDays(today, -7 * (7 - i)))
    return { label: start.slice(5), n: journal.filter((j) => { const k = j.created_at.slice(0, 10); return k >= start && k <= end }).length }
  })
  const maxW = Math.max(1, ...weeks.map((w) => w.n))
  const audioMin = Math.round(sessions.reduce((n, s) => n + s.duration_s, 0) / 60)
  const moods = journal.filter((j) => j.mood).slice(-14)

  if (!habits.length && !goals.length && !journal.length) return <Page title="Progress"><Empty icon="chart" title="Nothing to show yet">Your progress appears here as you check off habits, reach milestones and reflect.</Empty></Page>

  return (
    <Page title="Progress" subtitle="Patterns in what you actually did — the best evidence of who you’re becoming.">
      <div className="grid grid-cols-3 gap-3 text-center">
        {[[goals.filter((g) => g.status === 'done').length, 'goals achieved'], [journal.length, 'reflections'], [audioMin, 'audio minutes']].map(([n, l]) => (
          <Card key={l as string}><p className="font-serif text-2xl">{n}</p><p className="text-xs text-muted">{l}</p></Card>
        ))}
      </div>

      {habits.length > 0 && (
        <Section title="Consistency (last 5 weeks)">
          <Card>
            <div className="grid grid-cols-7 gap-1.5" role="img" aria-label="Habit completion heatmap for the last 35 days">
              {heat.map((h) => (
                <div key={h.k} title={h.label} className="aspect-square rounded-md bg-surface-2"
                  style={h.v ? { background: `color-mix(in oklab, var(--accent) ${Math.round(25 + h.v * 75)}%, var(--surface-2))` } : undefined} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Darker = more of that day’s habits completed.</p>
          </Card>
        </Section>
      )}

      {habits.length > 0 && (
        <Section title="Habits · last 30 days">
          <Card className="space-y-3">
            {habits.map((h) => {
              const r = completionRate(byHabit.get(h.id) ?? new Set(), h.days, 30, today, h.created_at.slice(0, 10))
              return (
                <div key={h.id}>
                  <div className="mb-1 flex justify-between text-sm"><span>{h.title}</span><span className="text-muted">{Math.round(r * 100)}%</span></div>
                  <Progress value={r} label={`${h.title} completion`} />
                </div>
              )
            })}
          </Card>
        </Section>
      )}

      {goals.some((g) => g.milestones.length) && (
        <Section title="Goal milestones">
          <Card className="space-y-3">
            {goals.filter((g) => g.milestones.length).map((g) => {
              const d = g.milestones.filter((m) => m.done).length
              return (
                <div key={g.id}>
                  <div className="mb-1 flex justify-between text-sm"><span>{g.title}</span><span className="text-muted">{d}/{g.milestones.length}</span></div>
                  <Progress value={d / g.milestones.length} label={`${g.title} milestones`} />
                </div>
              )
            })}
          </Card>
        </Section>
      )}

      <Section title="Reflections per week">
        <Card>
          <div className="flex h-32 items-end gap-2" role="img" aria-label="Journal entries per week for the last 8 weeks">
            {weeks.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-muted">{w.n || ''}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-accent to-warm" style={{ height: `${(w.n / maxW) * 90}px`, minHeight: w.n ? 4 : 0 }} />
                <span className="text-[10px] text-muted">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {moods.length > 1 && (
        <Section title="Recent mood">
          <Card className="flex items-end gap-1.5">
            {moods.map((m) => <div key={m.id} title={new Date(m.created_at).toLocaleDateString()} className="flex-1 rounded-md bg-accent/70" style={{ height: `${m.mood! * 14}px` }} />)}
          </Card>
        </Section>
      )}
      <p className="text-sm text-muted">These numbers reflect your actions, not brain changes. Consistency over weeks is what makes new behaviors feel more automatic.</p>
    </Page>
  )
}
