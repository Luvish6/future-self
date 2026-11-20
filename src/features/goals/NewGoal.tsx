import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Field, IconButton, Page, Section } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { ThemeDot, ThemePicker } from '../../components/ThemePicker'
import { CUSTOM, PRESETS, draftFromPack, type WorldPack } from '../../content/worlds'
import { CATEGORY_LABEL } from '../../lib/engine/categorize'
import { db } from '../../lib/store'
import { setActiveGoal } from '../../lib/hooks'
import { defaultTheme } from '../../lib/worlds'
import type { WorldTheme } from '../../lib/types'
import { cleanText, uid } from '../../lib/util'

type Item = { id: string; text: string; on: boolean; minutes?: number }
const items = (xs: string[]) => xs.map((text) => ({ id: uid(), text, on: true }))

/** Editable checklist: keep, edit, remove or add suggestions. */
function EditableList({ title, hint, list, onChange, max, placeholder }: { title: string; hint?: string; list: Item[]; onChange: (l: Item[]) => void; max: number; placeholder: string }) {
  const [add, setAdd] = useState('')
  const push = () => {
    const t = cleanText(add, max)
    if (t) onChange([...list, { id: uid(), text: t, on: true, minutes: list[0]?.minutes !== undefined ? 5 : undefined }])
    setAdd('')
  }
  const set = (id: string, p: Partial<Item>) => onChange(list.map((x) => (x.id === id ? { ...x, ...p } : x)))
  return (
    <Section title={title}>
      {hint && <p className="-mt-2 mb-2 text-xs text-muted">{hint}</p>}
      <Card className="space-y-1 p-2 md:p-2">
        {list.map((x) => (
          <div key={x.id} className="flex items-center gap-2 rounded-xl px-2 py-1">
            <input type="checkbox" className="size-4 shrink-0 accent-[var(--accent)]" checked={x.on} aria-label={`Include: ${x.text}`} onChange={(e) => set(x.id, { on: e.target.checked })} />
            <input className={`min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 outline-none focus:bg-surface-2 ${x.on ? '' : 'text-muted line-through'}`} value={x.text} maxLength={max} aria-label="Edit item" onChange={(e) => set(x.id, { text: e.target.value })} />
            {x.minutes !== undefined && <span className="shrink-0 text-xs text-muted">{x.minutes} min</span>}
            <IconButton icon="x" label={`Remove: ${x.text}`} onClick={() => onChange(list.filter((y) => y.id !== x.id))} />
          </div>
        ))}
        <div className="flex gap-2 p-1">
          <input className="field" value={add} maxLength={max} placeholder={placeholder} aria-label={`Add to ${title}`} onChange={(e) => setAdd(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); push() } }} />
          <Button variant="soft" icon="plus" onClick={push} disabled={!add.trim()}>Add</Button>
        </div>
      </Card>
    </Section>
  )
}

export default function NewGoal() {
  const nav = useNavigate()
  const [pack, setPack] = useState<WorldPack | null>(null)
  const [f, setF] = useState({ title: '', description: '', why: '', identity: '' })
  const [theme, setTheme] = useState<WorldTheme>('neutral')
  const [affs, setAffs] = useState<Item[]>([])
  const [habits, setHabits] = useState<Item[]>([])
  const [miles, setMiles] = useState<Item[]>([])
  const [questions, setQuestions] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)

  const choose = (p: WorldPack) => {
    const d = draftFromPack(p)
    setPack(p)
    setF({ title: d.title, description: d.description, why: '', identity: d.identity_statement })
    setTheme(defaultTheme(p.category))
    setAffs(items(d.affirmations))
    setHabits(d.habits.map((h) => ({ id: uid(), text: h.title, minutes: h.minutes, on: true })))
    setMiles(items(d.milestones))
    setQuestions(items(d.reflection_questions))
    window.scrollTo(0, 0)
  }
  const kept = (l: Item[], max: number) => l.filter((x) => x.on && x.text.trim()).map((x) => ({ ...x, text: cleanText(x.text, max) }))

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!pack || !f.title.trim()) return
    setSaving(true)
    const goal = await db.save('goals', {
      title: cleanText(f.title, 200), category: pack.category, theme, status: 'active', target_date: null,
      description: cleanText(f.description, 1000), why: cleanText(f.why), identity_statement: cleanText(f.identity, 500),
      milestones: kept(miles, 200).map((m) => ({ id: uid(), title: m.text, done: false })),
      reflection_questions: kept(questions, 300).slice(0, 12).map((q) => q.text),
    })
    for (const a of kept(affs, 500)) await db.save('affirmations', { goal_id: goal.id, text: a.text, audio_key: null, is_favorite: false })
    for (const h of kept(habits, 200)) await db.save('habits', { goal_id: goal.id, title: h.text, cue: '', minutes: h.minutes ?? 5, days: [], active: true })
    setActiveGoal(goal.id)
    nav(`/g/${goal.id}`)
  }

  if (!pack)
    return (
      <Page title="New goal" subtitle="Start from a suggested goal world, or build your own." back="/goals">
        <ul className="grid gap-3 sm:grid-cols-2">
          {[...PRESETS, CUSTOM].map((p) => (
            <li key={p.category}>
              <button type="button" onClick={() => choose(p)} className="flex h-full w-full items-start gap-3 rounded-2xl border border-line bg-surface/80 p-4 text-left transition hover:border-accent">
                {p.category === 'custom'
                  ? <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Icon name="plus" /></span>
                  : <ThemeDot theme={defaultTheme(p.category)} className="mt-1 size-7" />}
                <span>
                  <span className="block font-medium">{p.category === 'custom' ? 'Create my own' : CATEGORY_LABEL[p.category]}</span>
                  <span className="text-sm text-muted">{p.blurb}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Suggestions are a starting point — you can edit or remove any of them now or later.</p>
      </Page>
    )

  const custom = pack.category === 'custom'
  return (
    <div data-world={theme}>
      <Page title={custom ? 'Create your own goal' : CATEGORY_LABEL[pack.category]} subtitle="Make it yours. Untick anything that doesn’t fit.">
        <form onSubmit={create} className="space-y-6">
          <Card className="space-y-4">
            <Field label="Goal">{(id) => <input id={id} className="field" required maxLength={200} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Feel at home in my own skin" />}</Field>
            <Field label="Description (optional)">{(id) => <textarea id={id} className="field min-h-16" maxLength={1000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}</Field>
            <Field label="Why it matters to you">{(id) => <textarea id={id} className="field min-h-16" maxLength={2000} value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} />}</Field>
            <Field label="Identity statement" hint="Who you’re becoming — phrased as a process.">{(id) => <input id={id} className="field" maxLength={500} value={f.identity} onChange={(e) => setF({ ...f, identity: e.target.value })} />}</Field>
            <div><p className="mb-2 text-sm font-medium">Colours</p><ThemePicker value={theme} onChange={setTheme} /></div>
          </Card>
          <EditableList title="Affirmations" list={affs} onChange={setAffs} max={500} placeholder="Write your own affirmation" />
          <EditableList title="Habits" hint="Start small — you can add schedules and cues later." list={habits} onChange={setHabits} max={200} placeholder="Add a custom habit" />
          <EditableList title="Milestones" list={miles} onChange={setMiles} max={200} placeholder="Add a milestone" />
          <EditableList title="Reflection questions" list={questions} onChange={setQuestions} max={300} placeholder="Add a question" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPack(null)}>Back</Button>
            <Button type="submit" disabled={saving || !f.title.trim()}>{saving ? 'Creating…' : 'Create goal world'}</Button>
          </div>
        </form>
      </Page>
    </div>
  )
}
