import { useState } from 'react'
import { Button, Card, Chip, Empty, IconButton, Page, Segmented } from '../../components/ui'
import { useCollection } from '../../lib/store'
import { CATEGORY_LABEL } from '../../lib/engine/categorize'
import type { VisionItem } from '../../lib/types'
import { cleanText } from '../../lib/util'

/** Downscale + re-encode images client-side so they stay small and drop EXIF metadata (e.g. GPS). */
async function compress(file: File, max = 900): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 15 * 1024 * 1024) throw new Error('Image is too large (max 15 MB).')
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.78)
}

type Kind = VisionItem['kind']
const KIND_OPTS: { value: Kind; label: string }[] = [
  { value: 'image', label: 'Image' }, { value: 'quote', label: 'Quote' }, { value: 'milestone', label: 'Milestone' }, { value: 'description', label: 'Future self' },
]

export default function VisionBoard() {
  const { rows, save, remove } = useCollection('vision_items')
  const goals = useCollection('goals').rows
  const [kind, setKind] = useState<Kind>('image')
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [goalId, setGoalId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [err, setErr] = useState('')

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (kind === 'image' ? !image : !text.trim()) return
    const g = goals.find((x) => x.id === goalId)
    await save({ kind, text: cleanText(text, 500), image: kind === 'image' ? image : null, goal_id: goalId, category: g?.category ?? 'general' })
    setText('')
    setImage(null)
  }
  const shown = rows.filter((r) => filter === 'all' || r.goal_id === filter)

  return (
    <Page title="Vision board" subtitle="A visual reminder of what you’re building — and why.">
      <Card>
        <form onSubmit={add} className="space-y-3">
          <Segmented label="Item type" value={kind} onChange={setKind} options={KIND_OPTS} />
          {kind === 'image' && (
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" aria-label="Choose image" className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent"
                onChange={async (e) => { setErr(''); const f = e.target.files?.[0]; if (f) try { setImage(await compress(f)) } catch (x) { setErr((x as Error).message) } }} />
              {image && <img src={image} alt="Preview" className="size-14 rounded-lg object-cover" />}
            </div>
          )}
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <textarea className="field min-h-20" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} aria-label={kind === 'image' ? 'Caption' : 'Text'}
            placeholder={{ image: 'Caption (optional)', quote: 'A quote that moves you', milestone: 'e.g. First 1,000 saved', description: 'Describe your future self: how you spend a Tuesday, how you feel…' }[kind]} />
          {goals.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Goal">
              {goals.map((g) => <Chip key={g.id} active={goalId === g.id} onClick={() => setGoalId(goalId === g.id ? null : g.id)}>{g.title}</Chip>)}
            </div>
          )}
          <div className="flex justify-end"><Button type="submit" icon="plus">Add to board</Button></div>
        </form>
      </Card>

      {goals.length > 0 && rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
          {goals.map((g) => <Chip key={g.id} active={filter === g.id} onClick={() => setFilter(g.id)}>{g.title}</Chip>)}
        </div>
      )}

      {shown.length === 0 ? <Empty icon="image" title="Your board is empty">Add images, quotes, milestones, or a description of your future self.</Empty> : (
        <ul className="columns-2 gap-3 md:columns-3 [&>li]:mb-3">
          {shown.map((it) => (
            <li key={it.id} className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface">
              {it.image && <img src={it.image} alt={it.text || 'Vision board image'} className="w-full" loading="lazy" />}
              {it.text && (
                <div className={it.kind === 'quote' ? 'p-4 font-serif text-lg italic' : it.kind === 'milestone' ? 'bg-gradient-to-br from-accent to-warm p-4 font-medium text-white' : 'p-4 text-sm'}>
                  {it.kind === 'milestone' && <span className="mb-1 block text-xs uppercase tracking-wider opacity-80">Milestone</span>}
                  {it.kind === 'quote' ? `“${it.text}”` : it.text}
                </div>
              )}
              <p className="px-4 pb-3 text-[11px] text-muted">{CATEGORY_LABEL[it.category]}</p>
              <div className="absolute right-1 top-1 rounded-full bg-surface/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <IconButton icon="trash" label="Remove item" onClick={() => confirm('Remove from board?') && remove(it.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
