import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Empty, Field, IconButton, Page, Progress, Segmented } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { CATEGORY_LABEL, categorize } from '../../lib/engine/categorize'
import type { Category, Goal } from '../../lib/types'
import { cleanText, uid } from '../../lib/util'

const CATS = Object.keys(CATEGORY_LABEL) as Category[]
const blank = (): Partial<Goal> => ({ title: '', category: 'general', why: '', identity_statement: '', target_date: null, status: 'active', milestones: [] })

function GoalForm({ initial, onDone }: { initial: Partial<Goal>; onDone: () => void }) {
  const { save } = useCollection('goals')
  const [g, setG] = useState(initial)
  const [ms, setMs] = useState('')
  const set = (p: Partial<Goal>) => setG({ ...g, ...p })
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!g.title?.trim()) return
    await save({ ...g, title: cleanText(g.title, 200), why: cleanText(g.why ?? ''), identity_statement: cleanText(g.identity_statement ?? '', 500) })
    onDone()
  }
  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Goal">{(id) => <input id={id} className="field" required maxLength={200} value={g.title} onChange={(e) => set({ title: e.target.value, ...(g.id ? {} : { category: categorize(e.target.value) }) })} placeholder="e.g. Speak confidently in meetings" />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Area">{(id) => (
            <select id={id} className="field" value={g.category} onChange={(e) => set({ category: e.target.value as Category })}>
              {CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>)}</Field>
          <Field label="Target date (optional)">{(id) => <input id={id} type="date" className="field" value={g.target_date ?? ''} onChange={(e) => set({ target_date: e.target.value || null })} />}</Field>
        </div>
        <Field label="Why it matters">{(id) => <textarea id={id} className="field min-h-20" maxLength={2000} value={g.why} onChange={(e) => set({ why: e.target.value })} />}</Field>
        <Field label="Identity statement" hint="Who you’re becoming, phrased as a process: “I’m becoming someone who…”">{(id) => <input id={id} className="field" maxLength={500} value={g.identity_statement} onChange={(e) => set({ identity_statement: e.target.value })} />}</Field>
        <div>
          <p className="mb-1.5 text-sm font-medium">Milestones</p>
          <ul className="space-y-1">
            {g.milestones?.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{m.title}</span>
                <IconButton icon="x" label={`Remove ${m.title}`} onClick={() => set({ milestones: g.milestones!.filter((x) => x.id !== m.id) })} />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input className="field" value={ms} maxLength={200} onChange={(e) => setMs(e.target.value)} placeholder="Add a milestone" aria-label="New milestone"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (ms.trim()) { set({ milestones: [...(g.milestones ?? []), { id: uid(), title: cleanText(ms, 200), done: false }] }); setMs('') } } }} />
            <Button variant="soft" icon="plus" onClick={() => { if (ms.trim()) { set({ milestones: [...(g.milestones ?? []), { id: uid(), title: cleanText(ms, 200), done: false }] }); setMs('') } }}>Add</Button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onDone}>Cancel</Button>
          <Button type="submit">Save goal</Button>
        </div>
      </form>
    </Card>
  )
}

export default function Goals() {
  const { rows, save, remove } = useCollection('goals')
  const [editing, setEditing] = useState<Partial<Goal> | null>(null)
  const [filter, setFilter] = useState<Goal['status']>('active')
  const list = rows.filter((g) => g.status === filter)

  return (
    <Page title="Goals" subtitle="What you’re working toward, and who you’re becoming."
      actions={!editing && <Button icon="plus" onClick={() => setEditing(blank())}>New</Button>}>
      {editing && <GoalForm initial={editing} onDone={() => setEditing(null)} />}
      <div className="flex items-center justify-between gap-3">
        <Segmented label="Filter goals" value={filter} onChange={setFilter} options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'done', label: 'Done' }]} />
        <Link to="/onboarding" className="text-sm text-accent">Edit onboarding answers</Link>
      </div>
      {list.length === 0 && !editing && <Empty icon="target" title={`No ${filter} goals`}>Start with one meaningful goal. You can always add more.</Empty>}
      <ul className="space-y-3">
        {list.map((g) => {
          const done = g.milestones.filter((m) => m.done).length
          return (
            <Card as="li" key={g.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-accent">{CATEGORY_LABEL[g.category]}{g.target_date && ` · by ${new Date(g.target_date + 'T00:00').toLocaleDateString()}`}</p>
                  <h2 className="mt-0.5 text-xl">{g.title}</h2>
                  {g.identity_statement && <p className="mt-1 text-sm italic text-muted">{g.identity_statement}</p>}
                </div>
                <div className="flex">
                  <IconButton icon="edit" label="Edit goal" onClick={() => setEditing(g)} />
                  <IconButton icon="trash" label="Delete goal" onClick={() => confirm(`Delete “${g.title}”?`) && remove(g.id)} />
                </div>
              </div>
              {g.why && <p className="mt-3 text-sm"><span className="font-medium">Why: </span>{g.why}</p>}
              {g.milestones.length > 0 && (
                <div className="mt-4">
                  <Progress value={done / g.milestones.length} label="Milestone progress" />
                  <ul className="mt-3 space-y-1">
                    {g.milestones.map((m) => (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1 text-sm hover:bg-surface-2">
                          <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={m.done}
                            onChange={() => save({ id: g.id, milestones: g.milestones.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)) })} />
                          <span className={m.done ? 'text-muted line-through' : ''}>{m.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {g.status !== 'done' && <Button size="sm" variant="soft" icon="check" onClick={() => save({ id: g.id, status: 'done' })}>Mark achieved</Button>}
                {g.status === 'active' && <Button size="sm" variant="ghost" onClick={() => save({ id: g.id, status: 'paused' })}>Pause</Button>}
                {g.status !== 'active' && <Button size="sm" variant="ghost" onClick={() => save({ id: g.id, status: 'active' })}>Reactivate</Button>}
                <Link to={`/visualize?goal=${g.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent"><Icon name="eye" className="size-4" /> Rehearse</Link>
              </div>
            </Card>
          )
        })}
      </ul>
    </Page>
  )
}
