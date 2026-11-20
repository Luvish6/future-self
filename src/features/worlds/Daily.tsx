import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Chip, Section, cx } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { useHabitLogs } from '../../lib/hooks'
import { challengesFor, pickDaily, reflectionQuestions } from '../../lib/engine/daily'
import { narrate, ttsSupported } from '../../lib/audio/narrator'
import { addDays, cleanText, dayKey } from '../../lib/util'
import type { Goal } from '../../lib/types'

type CardId = 'affirmation' | 'visualization' | 'challenge' | 'reflection' | 'progress'
const CARDS: { id: CardId; label: string }[] = [
  { id: 'affirmation', label: 'Affirmation' }, { id: 'visualization', label: 'Visualization' },
  { id: 'challenge', label: 'Challenge' }, { id: 'reflection', label: 'Reflection' }, { id: 'progress', label: 'Progress' },
]
const MOODS = ['😞', '😕', '😐', '🙂', '😄']

// Device-only conveniences (not sensitive): today's skips/offsets and which cards to show.
interface DayState { skip: CardId[]; aff: number; ch: number; challengeDone: boolean }
function useStored<T>(key: string, init: T): [T, (v: T) => void] {
  const read = () => { try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : init } catch { return init } }
  const [v, setV] = useState<T>(read)
  useEffect(() => setV(read()), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return [v, (n: T) => { setV(n); try { localStorage.setItem(key, JSON.stringify(n)) } catch { /* ignore */ } }]
}

export function DailyExperience({ goal }: { goal: Goal }) {
  const today = dayKey()
  const [day, setDay] = useStored<DayState>(`fs:day:${goal.id}:${today}`, { skip: [], aff: 0, ch: 0, challengeDone: false })
  const [hidden, setHidden] = useStored<CardId[]>(`fs:cards:${goal.id}`, [])
  const [customize, setCustomize] = useState(false)
  const affs = useCollection('affirmations').rows.filter((a) => a.goal_id === goal.id)
  const vizs = useCollection('visualizations').rows.filter((v) => v.goal_id === goal.id)
  const habits = useCollection('habits').rows.filter((h) => h.goal_id === goal.id)
  const journal = useCollection('journal_entries')
  const { byHabit } = useHabitLogs()
  const [mood, setMood] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [playing, setPlaying] = useState<string | null>(null)
  const ctl = useRef<{ stop(): void } | null>(null)
  useEffect(() => () => ctl.current?.stop(), [])

  const aff = pickDaily(affs, goal.id, today, day.aff)
  const viz = [...vizs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const challenge = pickDaily(challengesFor(goal.category, habits.map((h) => h.title)), goal.id, today, day.ch)
  const question = pickDaily(reflectionQuestions(goal.reflection_questions), goal.id, today)!
  const reflectedToday = journal.rows.some((j) => j.goal_id === goal.id && j.kind === 'reflection' && j.created_at.slice(0, 10) === today)
  const weekFrom = dayKey(addDays(new Date(), -6))
  const checkins = habits.reduce((n, h) => n + [...(byHabit.get(h.id) ?? [])].filter((d) => d >= weekFrom).length, 0)
  const msDone = goal.milestones.filter((m) => m.done).length
  const goalEntries = journal.rows.filter((j) => j.goal_id === goal.id).length

  const show = (id: CardId) => !hidden.includes(id) && !day.skip.includes(id)
  const skip = (id: CardId) => setDay({ ...day, skip: [...day.skip, id] })
  const speak = (key: string, text: string) => {
    ctl.current?.stop()
    if (playing === key) return setPlaying(null)
    setPlaying(key)
    ctl.current = narrate(text, { onEnd: () => setPlaying(null) })
  }
  const SkipBtn = ({ id }: { id: CardId }) => <Button size="sm" variant="ghost" onClick={() => skip(id)}>Skip today</Button>

  return (
    <Section title="Today in this world" action={<Button size="sm" variant="ghost" icon="settings" onClick={() => setCustomize(!customize)}>Customize</Button>}>
      {customize && (
        <Card className="mb-3">
          <p className="mb-2 text-sm text-muted">Show these on this goal’s page:</p>
          <div className="flex flex-wrap gap-2">
            {CARDS.map((c) => <Chip key={c.id} active={!hidden.includes(c.id)} onClick={() => setHidden(hidden.includes(c.id) ? hidden.filter((x) => x !== c.id) : [...hidden, c.id])}>{c.label}</Chip>)}
          </div>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {show('affirmation') && (
          <Card className="flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">Today’s affirmation</p>
            {aff ? <p className="mt-2 flex-1 font-serif text-xl leading-snug">{aff.text}</p>
              : <p className="mt-2 flex-1 text-sm text-muted">No affirmations for this goal yet. <Link className="text-accent" to={`/affirmations?goal=${goal.id}`}>Add one</Link></p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {aff && ttsSupported() && <Button size="sm" variant="soft" icon={playing === 'aff' ? 'stop' : 'play'} onClick={() => speak('aff', aff.text)}>{playing === 'aff' ? 'Stop' : 'Listen'}</Button>}
              {affs.length > 1 && <Button size="sm" variant="ghost" onClick={() => setDay({ ...day, aff: day.aff + 1 })}>Another</Button>}
              <SkipBtn id="affirmation" />
            </div>
          </Card>
        )}
        {show('visualization') && (
          <Card className="flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">Visualization</p>
            {viz ? <p className="mt-2 flex-1"><span className="font-medium">{viz.title}</span> <span className="text-sm text-muted">· {viz.duration_min} min rehearsal</span></p>
              : <p className="mt-2 flex-1 text-sm text-muted">Rehearse one real step toward this goal in a few minutes.</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {viz && ttsSupported() && <Button size="sm" variant="soft" icon={playing === 'viz' ? 'stop' : 'play'} onClick={() => speak('viz', viz.script)}>{playing === 'viz' ? 'Stop' : 'Play'}</Button>}
              <Link to={`/visualize?goal=${goal.id}`} className="inline-flex items-center px-3 py-1.5 text-sm text-accent">{viz ? 'New script' : 'Create a script'}</Link>
              <SkipBtn id="visualization" />
            </div>
          </Card>
        )}
        {show('challenge') && challenge && (
          <Card className="flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">Optional challenge</p>
            <p className="mt-2 flex-1 text-lg">{challenge}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Button size="sm" icon="check" disabled={day.challengeDone} onClick={async () => {
                await journal.save({ kind: 'win', goal_id: goal.id, title: 'Goal challenge', body: `Completed: ${challenge}`, mood: null, open_on: null })
                setDay({ ...day, challengeDone: true })
              }}>{day.challengeDone ? 'Logged as a win' : 'I did it'}</Button>
              {!day.challengeDone && <Button size="sm" variant="ghost" onClick={() => setDay({ ...day, ch: day.ch + 1 })}>Another</Button>}
              <SkipBtn id="challenge" />
            </div>
          </Card>
        )}
        {show('reflection') && (
          <Card className="flex flex-col">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">Check in</p>
            {reflectedToday ? (
              <p className="mt-2 flex-1 text-sm">Reflected today <Icon name="check" className="inline size-4 text-ok" /> <Link className="text-accent" to="/journal">See journal</Link></p>
            ) : (
              <form className="mt-2 flex flex-1 flex-col gap-2" onSubmit={async (e) => {
                e.preventDefault()
                await journal.save({ kind: 'reflection', goal_id: goal.id, title: question, body: cleanText(note, 20000) || '(mood check-in)', mood, open_on: null })
                setNote(''); setMood(null)
              }}>
                <div className="flex gap-1" role="radiogroup" aria-label="How are you feeling?">
                  {MOODS.map((m, i) => (
                    <button key={m} type="button" role="radio" aria-checked={mood === i + 1} aria-label={`Mood ${i + 1} of 5`} onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                      className={cx('grid size-9 place-items-center rounded-full text-lg', mood === i + 1 ? 'bg-accent-soft ring-2 ring-accent' : 'opacity-60 hover:opacity-100')}>{m}</button>
                  ))}
                </div>
                <label className="text-sm font-medium">{question}
                  <textarea className="field mt-1 min-h-16 font-normal" maxLength={20000} value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" type="submit" disabled={!mood && !note.trim()}>Save</Button>
                  <SkipBtn id="reflection" />
                </div>
              </form>
            )}
          </Card>
        )}
        {show('progress') && (
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-accent">Progress</p>
            <div className="mt-3 grid grid-cols-3 text-center">
              {[[checkins, 'check-ins this week'], [`${msDone}/${goal.milestones.length}`, 'milestones'], [goalEntries, 'reflections & wins']].map(([n, l]) => (
                <div key={l as string}><p className="font-serif text-2xl">{n}</p><p className="text-xs text-muted">{l}</p></div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Counts of what you’ve actually done — the clearest evidence of change.</p>
          </Card>
        )}
      </div>
      {day.skip.length > 0 && (
        <p className="mt-3 text-sm text-muted">Skipped for today: {day.skip.map((s) => CARDS.find((c) => c.id === s)?.label).join(', ')}. That’s okay. <button type="button" className="text-accent" onClick={() => setDay({ ...day, skip: [] })}>Show again</button></p>
      )}
    </Section>
  )
}
