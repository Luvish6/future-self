import { useMemo, useState } from 'react'
import { Button, Card, Empty, IconButton, Notice, Page, Section, Segmented } from '../../components/ui'
import { useCollection } from '../../lib/store'
import { analyzeDay, placeHabits } from '../../lib/engine/routine'
import type { BlockKind } from '../../lib/types'
import { cleanText, fmtMinutes, fmtTime } from '../../lib/util'

const KINDS: BlockKind[] = ['sleep', 'work', 'study', 'commute', 'family', 'exercise', 'meal', 'free', 'other']
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Routine() {
  const { rows, save, remove } = useCollection('routine_blocks')
  const habits = useCollection('habits')
  const [day, setDay] = useState(new Date().getDay())
  const [b, setB] = useState({ start: '09:00', end: '17:00', label: '', kind: 'work' as BlockKind })

  const blocks = rows.filter((r) => r.weekday === day).sort((x, y) => x.start.localeCompare(y.start))
  const analysis = useMemo(() => analyzeDay(blocks), [blocks])
  const active = habits.rows.filter((h) => h.active && (h.days.length === 0 || h.days.includes(day)))
  const suggestions = placeHabits(analysis.gaps, active.map((h) => ({ title: h.title, minutes: h.minutes })))

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    await save({ ...b, weekday: day, label: cleanText(b.label, 80) || b.kind })
  }
  const copyTo = async (targets: number[]) => {
    for (const t of targets) {
      if (t === day) continue
      for (const old of rows.filter((r) => r.weekday === t)) await remove(old.id)
      for (const x of blocks) await save({ weekday: t, start: x.start, end: x.end, label: x.label, kind: x.kind })
    }
  }

  return (
    <Page title="Daily routine" subtitle="Map your real schedule, then find realistic room for growth.">
      <div className="overflow-x-auto"><Segmented label="Weekday" value={day} onChange={setDay} options={WD.map((w, i) => ({ value: i, label: w }))} /></div>

      <Card>
        <form onSubmit={add} className="grid grid-cols-2 gap-3 sm:grid-cols-[auto_auto_1fr_auto_auto] sm:items-end">
          <label className="text-sm">From<input type="time" className="field mt-1" value={b.start} onChange={(e) => setB({ ...b, start: e.target.value })} required /></label>
          <label className="text-sm">To<input type="time" className="field mt-1" value={b.end} onChange={(e) => setB({ ...b, end: e.target.value })} required /></label>
          <label className="col-span-2 text-sm sm:col-span-1">Label<input className="field mt-1" value={b.label} maxLength={80} onChange={(e) => setB({ ...b, label: e.target.value })} placeholder="e.g. Office" /></label>
          <label className="text-sm">Type
            <select className="field mt-1" value={b.kind} onChange={(e) => setB({ ...b, kind: e.target.value as BlockKind })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
          </label>
          <Button type="submit" icon="plus">Add</Button>
        </form>
      </Card>

      {blocks.length === 0 ? <Empty icon="clock" title={`Nothing mapped for ${WD[day]}`}>Add sleep, work and other commitments. Overnight blocks (e.g. 23:00–07:00) are fine.</Empty> : (
        <Section title={`${WD[day]} schedule`} action={
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => confirm('Copy this day to Mon–Fri (replacing them)?') && copyTo([1, 2, 3, 4, 5])}>Copy to weekdays</Button>
            <Button size="sm" variant="ghost" onClick={() => confirm('Copy this day to every day (replacing them)?') && copyTo([0, 1, 2, 3, 4, 5, 6])}>All days</Button>
          </div>}>
          <Card className="p-2 md:p-2">
            <ul>
              {blocks.map((x) => (
                <li key={x.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2">
                  <span className="w-28 text-sm tabular-nums text-muted">{x.start}–{x.end}</span>
                  <span className="flex-1">{x.label}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{x.kind}</span>
                  <IconButton icon="trash" label={`Remove ${x.label}`} onClick={() => remove(x.id)} />
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      {blocks.length > 0 && (
        <Section title="Analysis">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[[fmtMinutes(analysis.sleepMinutes), 'sleep'], [fmtMinutes(analysis.scheduledMinutes - analysis.sleepMinutes), 'committed'], [fmtMinutes(analysis.freeMinutes), 'open time']].map(([v, l]) => (
              <Card key={l}><p className="font-serif text-xl">{v}</p><p className="text-xs text-muted">{l}</p></Card>
            ))}
          </div>
          <div className="mt-3 space-y-2">{analysis.warnings.map((w) => <Notice key={w} tone="warn">{w}</Notice>)}</div>
          {analysis.gaps.length > 0 && (
            <p className="mt-3 text-sm text-muted">Open windows: {analysis.gaps.map((g) => `${fmtTime(g.start)}–${fmtTime(g.end)}`).join(', ')}</p>
          )}
          {suggestions.length > 0 ? (
            <Card className="mt-4">
              <h3 className="text-base">Suggested placement for your habits</h3>
              <ul className="mt-2 space-y-2">
                {suggestions.map((s) => {
                  const h = active.find((x) => x.title === s.habit)!
                  return (
                    <li key={s.habit} className="flex items-center justify-between gap-2 text-sm">
                      <span><span className="tabular-nums text-accent">{s.at}</span> · {s.habit} ({s.minutes} min)</span>
                      <Button size="sm" variant="soft" onClick={() => habits.save({ id: h.id, cue: `Around ${s.at}` })}>Use as cue</Button>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 text-xs text-muted">Suggestions fit inside open time with a short buffer. There’s no universal “successful person’s routine” — keep what works for your life.</p>
            </Card>
          ) : active.length > 0 && <Notice>Not enough open time for your habits on this day. Try shorter versions or attach them to existing routines (e.g. during your commute).</Notice>}
        </Section>
      )}
    </Page>
  )
}
