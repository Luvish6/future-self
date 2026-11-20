import { useMemo, useState } from 'react'
import { Button, Card, Chip, Empty, Field, IconButton, Page, Section, cx } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { useHabitLogs } from '../../lib/hooks'
import type { JournalEntry, JournalKind } from '../../lib/types'
import { addDays, cleanText, dayKey } from '../../lib/util'

const KINDS: { value: JournalKind; label: string; prompt: string }[] = [
  { value: 'reflection', label: 'Reflection', prompt: 'What happened today, and how did you respond? What would your future self notice?' },
  { value: 'gratitude', label: 'Gratitude', prompt: 'Three things you’re grateful for today, and why.' },
  { value: 'win', label: 'Win', prompt: 'What went well — however small? What did you do to make it happen?' },
  { value: 'obstacle', label: 'Obstacle', prompt: 'What got in the way? What could you try next time? (If… then I will…)' },
  { value: 'lesson', label: 'Lesson', prompt: 'What did you learn about yourself or your goal?' },
  { value: 'letter', label: 'Letter to future self', prompt: 'Dear future me… What do you hope I’ve kept doing? What do you want me to remember?' },
  { value: 'weekly', label: 'Weekly review', prompt: '' },
]
const MOODS = ['😞', '😕', '😐', '🙂', '😄']

export default function Journal() {
  const { rows, save, remove } = useCollection('journal_entries')
  const { logs } = useHabitLogs()
  const [kind, setKind] = useState<JournalKind>('reflection')
  const [draft, setDraft] = useState<Partial<JournalEntry> | null>(null)
  const [filter, setFilter] = useState<JournalKind | 'all'>('all')
  const [q, setQ] = useState('')
  const today = dayKey()

  const weeklyTemplate = () => {
    const since = dayKey(addDays(new Date(), -6))
    const done = logs.filter((l) => l.log_date >= since).length
    const entries = rows.filter((r) => r.created_at.slice(0, 10) >= since).length
    return `This week: ${done} habit check-ins, ${entries} journal entries.\n\nWhat went well?\n\nWhat was hard?\n\nWhat will I adjust next week?\n\nOne thing I’m proud of:\n`
  }
  const startNew = (k: JournalKind) => {
    setKind(k)
    setDraft({ kind: k, title: '', body: k === 'weekly' ? weeklyTemplate() : '', mood: null, open_on: null })
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft?.body?.trim()) return
    await save({ ...draft, title: cleanText(draft.title ?? '', 200), body: cleanText(draft.body, 20000) })
    setDraft(null)
  }

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return [...rows]
      .filter((r) => filter === 'all' || r.kind === filter)
      .filter((r) => !s || `${r.title} ${r.open_on && r.open_on > today ? '' : r.body}`.toLowerCase().includes(s))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [rows, filter, q, today])
  const meta = KINDS.find((k) => k.value === kind)!

  return (
    <Page title="Journal" subtitle={<span className="inline-flex items-center gap-1"><Icon name="lock" className="size-4" /> Private to you.</span>}>
      {!draft ? (
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => <Button key={k.value} size="sm" variant={k.value === 'reflection' ? 'primary' : 'soft'} icon="plus" onClick={() => startNew(k.value)}>{k.label}</Button>)}
        </div>
      ) : (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">{meta.label}</p>
            {meta.prompt && <p className="font-serif text-lg">{meta.prompt}</p>}
            <Field label="Title (optional)">{(id) => <input id={id} className="field" maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />}</Field>
            <textarea className="field min-h-52 leading-relaxed" aria-label="Entry" maxLength={20000} value={draft.body} autoFocus onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Mood">
                {MOODS.map((m, i) => (
                  <button key={m} type="button" role="radio" aria-checked={draft.mood === i + 1} aria-label={`Mood ${i + 1} of 5`}
                    onClick={() => setDraft({ ...draft, mood: draft.mood === i + 1 ? null : i + 1 })}
                    className={cx('grid size-9 place-items-center rounded-full text-lg transition', draft.mood === i + 1 ? 'bg-accent-soft ring-2 ring-accent' : 'opacity-60 hover:opacity-100')}>{m}</button>
                ))}
              </div>
              {kind === 'letter' && (
                <label className="flex items-center gap-2 text-sm">Seal until
                  <input type="date" className="field w-auto" min={dayKey(addDays(new Date(), 1))} value={draft.open_on ?? ''} onChange={(e) => setDraft({ ...draft, open_on: e.target.value || null })} />
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" disabled={!draft.body?.trim()}>Save entry</Button>
            </div>
          </form>
        </Card>
      )}

      <Section title="Entries">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input className="field sm:max-w-xs" type="search" placeholder="Search entries" aria-label="Search entries" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
            {KINDS.map((k) => <Chip key={k.value} active={filter === k.value} onClick={() => setFilter(k.value)}>{k.label}</Chip>)}
          </div>
        </div>
        {list.length === 0 ? <Empty icon="book" title="No entries yet">A few honest sentences are enough.</Empty> : (
          <ul className="space-y-3">
            {list.map((r) => {
              const sealed = !!r.open_on && r.open_on > today
              return (
                <Card as="li" key={r.id}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted">{KINDS.find((k) => k.value === r.kind)?.label} · {new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}{r.mood ? ` · ${MOODS[r.mood - 1]}` : ''}</p>
                      {r.title && <p className="mt-0.5 font-medium">{r.title}</p>}
                    </div>
                    {!sealed && <IconButton icon="edit" label="Edit entry" onClick={() => { setKind(r.kind); setDraft(r); scrollTo({ top: 0, behavior: 'smooth' }) }} />}
                    <IconButton icon="trash" label="Delete entry" onClick={() => confirm('Delete this entry permanently?') && remove(r.id)} />
                  </div>
                  {sealed
                    ? <p className="mt-2 flex items-center gap-2 text-sm text-muted"><Icon name="lock" className="size-4" /> Sealed until {new Date(r.open_on + 'T00:00').toLocaleDateString()}.</p>
                    : <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{r.body}</p>}
                </Card>
              )
            })}
          </ul>
        )}
      </Section>
    </Page>
  )
}
