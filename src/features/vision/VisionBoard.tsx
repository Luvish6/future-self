import { useEffect, useState } from 'react'
import { Button, Card, Chip, Empty, IconButton, Page, Segmented, cx } from '../../components/ui'
import { GoalScopeBar, useGoalScope } from '../../components/GoalScope'
import { useCollection } from '../../lib/store'
import { CATEGORY_LABEL } from '../../lib/engine/categorize'
import { byPosition, move, nextPosition, nextSize } from '../../lib/board'
import type { VisionItem } from '../../lib/types'
import { cleanText } from '../../lib/util'
import { Slideshow } from './Slideshow'

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
const SPAN: Record<'S' | 'M' | 'L', string> = { S: 'col-span-1', M: 'col-span-2', L: 'col-span-2 md:col-span-3' }
const PLACEHOLDER: Record<Kind, string> = {
  image: 'Caption (optional)', quote: 'A quote that moves you', milestone: 'e.g. First 1,000 saved',
  description: 'Describe your future self: how you spend a Tuesday, how you feel…',
}
const MILESTONE_BG = 'bg-gradient-to-br from-accent to-[color-mix(in_oklab,var(--accent)_70%,var(--warm))] text-accent-ink'

export default function VisionBoard() {
  const scope = useGoalScope()
  const boards = useCollection('vision_boards')
  const items = useCollection('vision_items')
  const goals = useCollection('goals').rows
  const list = byPosition(boards.rows.filter((b) => !scope.goal || b.goal_id === scope.goal.id))
  const [boardId, setBoardId] = useState<string | null>(null)
  const board = list.find((b) => b.id === boardId) ?? list[0]
  useEffect(() => { if (boardId && !list.some((b) => b.id === boardId)) setBoardId(null) }, [boardId, list])

  const [kind, setKind] = useState<Kind>('image')
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [showing, setShowing] = useState(false)

  const shown = board ? byPosition(items.rows.filter((i) => i.board_id === board.id)) : []
  const boardGoal = goals.find((g) => g.id === board?.goal_id)

  const newBoard = async () => {
    const goalId = scope.goal?.id ?? null
    const n = boards.rows.filter((b) => b.goal_id === goalId).length
    const b = await boards.save({ goal_id: goalId, title: `${scope.goal?.title ?? 'My board'}${n ? ` ${n + 1}` : ''}`.slice(0, 120) })
    setBoardId(b.id)
  }
  const deleteBoard = async () => {
    if (!board || !confirm(`Delete “${board.title}” and its ${shown.length} items?`)) return
    for (const i of shown) await items.remove(i.id)
    await boards.remove(board.id)
    setBoardId(null)
  }
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!board || (kind === 'image' ? !image : !text.trim())) return
    await items.save({
      kind, text: cleanText(text, 500), image: kind === 'image' ? image : null, goal_id: board.goal_id,
      category: boardGoal?.category ?? 'general', board_id: board.id, size: kind === 'image' ? 'M' : 'S', position: nextPosition(shown),
    })
    setText('')
    setImage(null)
  }
  const reorder = async (id: string, dir: -1 | 1) => {
    for (const ch of move(shown, id, dir)) await items.save(ch)
  }
  const rename = async (id: string, value: string) => {
    const t = cleanText(value, 120)
    if (t) await boards.save({ id, title: t })
    setRenaming(null)
  }

  return (
    <Page title="Vision boards" subtitle="Visual reminders of what you’re building — and why.">
      <GoalScopeBar scope={scope} />
      {showing && board && <Slideshow items={shown} title={board.title} onClose={() => setShowing(false)} />}

      <div className="flex flex-wrap items-center gap-2" aria-label="Boards">
        {list.map((b) =>
          renaming === b.id ? (
            <input key={b.id} defaultValue={b.title} maxLength={120} autoFocus aria-label="Board name" className="field w-44 py-1.5 text-sm"
              onBlur={(e) => rename(b.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenaming(null) }} />
          ) : (
            <Chip key={b.id} active={board?.id === b.id} onClick={() => setBoardId(b.id)}><span className="whitespace-nowrap">{b.title}</span></Chip>
          ),
        )}
        <Button size="sm" variant="soft" icon="plus" onClick={newBoard}>New board</Button>
        {board && (
          <span className="ml-auto flex">
            {shown.length > 0 && <IconButton icon="play" label="Play slideshow" onClick={() => setShowing(true)} />}
            <IconButton icon="edit" label="Rename board" onClick={() => setRenaming(board.id)} />
            <IconButton icon="trash" label="Delete board" onClick={deleteBoard} />
          </span>
        )}
      </div>

      {!board ? (
        <Empty icon="image" title="No boards yet" action={<Button icon="plus" onClick={newBoard}>Create a board</Button>}>
          Make as many boards as you like for {scope.goal ? `“${scope.goal.title}”` : 'your goals'}.
        </Empty>
      ) : (
        <>
          <Card>
            <form onSubmit={add} className="space-y-3">
              <Segmented label="Item type" value={kind} onChange={setKind} options={KIND_OPTS} />
              {kind === 'image' && (
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" aria-label="Choose image"
                    className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent"
                    onChange={async (e) => {
                      setErr('')
                      const f = e.target.files?.[0]
                      if (f) try { setImage(await compress(f)) } catch (x) { setErr((x as Error).message) }
                    }} />
                  {image && <img src={image} alt="Preview" className="size-14 rounded-lg object-cover" />}
                </div>
              )}
              {err && <p role="alert" className="text-sm text-danger">{err}</p>}
              <textarea className="field min-h-20" maxLength={500} value={text} onChange={(e) => setText(e.target.value)}
                aria-label={kind === 'image' ? 'Caption' : 'Text'} placeholder={PLACEHOLDER[kind]} />
              <div className="flex justify-end"><Button type="submit" icon="plus">Add to “{board.title}”</Button></div>
            </form>
          </Card>

          {shown.length === 0 ? (
            <Empty icon="image" title="This board is empty">Add photos, quotes, milestones, or a description of your future self.</Empty>
          ) : (
            <ul className="grid grid-flow-dense grid-cols-2 gap-3 md:grid-cols-3">
              {shown.map((it, idx) => (
                <li key={it.id} className={cx('group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface', SPAN[it.size ?? 'S'])}>
                  {it.image && <img src={it.image} alt={it.text || 'Vision board image'} className="w-full flex-1 object-cover" loading="lazy" />}
                  {editing?.id === it.id ? (
                    <form className="p-3" onSubmit={async (e) => { e.preventDefault(); await items.save({ id: it.id, text: cleanText(editing.text, 500) }); setEditing(null) }}>
                      <textarea className="field min-h-16 text-sm" autoFocus maxLength={500} aria-label="Edit text" value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
                      <div className="mt-2 flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        <Button size="sm" type="submit">Save</Button>
                      </div>
                    </form>
                  ) : it.text ? (
                    <div className={it.kind === 'quote' ? 'p-4 font-serif text-lg italic' : it.kind === 'milestone' ? `${MILESTONE_BG} p-4 font-medium` : 'p-4 text-sm'}>
                      {it.kind === 'milestone' && <span className="mb-1 block text-xs uppercase tracking-wider opacity-80">Milestone</span>}
                      {it.kind === 'quote' ? `“${it.text}”` : it.text}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-1 border-t border-line px-1.5 py-1 md:opacity-0 md:transition md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <span className="flex">
                      <IconButton icon="back" label="Move earlier" onClick={() => reorder(it.id, -1)} className={idx === 0 ? 'invisible' : ''} />
                      <IconButton icon="arrow" label="Move later" onClick={() => reorder(it.id, 1)} className={idx === shown.length - 1 ? 'invisible' : ''} />
                    </span>
                    <span className="flex items-center">
                      <button type="button" onClick={() => items.save({ id: it.id, size: nextSize(it.size) })} aria-label={`Size ${it.size ?? 'S'}, change size`} title="Change size"
                        className="grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-ink">{it.size ?? 'S'}</button>
                      <IconButton icon="edit" label="Edit text" onClick={() => setEditing({ id: it.id, text: it.text })} />
                      <IconButton icon="trash" label="Remove item" onClick={() => confirm('Remove from board?') && items.remove(it.id)} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">
            {boardGoal ? CATEGORY_LABEL[boardGoal.category] : 'General'} · Images are resized on your device and stored privately. Use the arrows to reorder and S/M/L to resize.
          </p>
        </>
      )}
    </Page>
  )
}
