import { useState } from 'react'
import { Button, Card, Field, IconButton, Section } from '../../components/ui'
import { useCollection } from '../../lib/store'
import type { Affirmation, Playlist, PlaylistItem, Visualization } from '../../lib/types'
import { cleanText } from '../../lib/util'

/** Create/edit playlists that combine affirmations (your recording or TTS) and visualization scripts. */
export function Playlists({ goalId, affs, vizs, disabled }: { goalId: string | null; affs: Affirmation[]; vizs: Visualization[]; disabled: boolean }) {
  const { rows, save, remove } = useCollection('playlists')
  const list = rows.filter((p) => !goalId || p.goal_id === goalId)
  const [draft, setDraft] = useState<Partial<Playlist> | null>(null)
  const label = (it: PlaylistItem) => (it.type === 'affirmation' ? affs.find((a) => a.id === it.id)?.text : vizs.find((v) => v.id === it.id)?.title) ?? '(removed)'
  const has = (it: PlaylistItem) => draft?.items?.some((x) => x.type === it.type && x.id === it.id)
  const toggle = (it: PlaylistItem) => setDraft({ ...draft, items: has(it) ? draft!.items!.filter((x) => !(x.type === it.type && x.id === it.id)) : [...(draft?.items ?? []), it] })
  const moveUp = (i: number) => {
    const items = [...(draft?.items ?? [])]
    if (i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]]
    setDraft({ ...draft, items })
  }

  return (
    <Section title="Playlists" action={!draft && <Button size="sm" variant="soft" icon="plus" disabled={disabled} onClick={() => setDraft({ title: '', items: [], loop: true, goal_id: goalId })}>New playlist</Button>}>
      {draft ? (
        <Card className="space-y-4">
          <Field label="Name">{(id) => <input id={id} className="field" maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Evening wind-down" />}</Field>
          <div>
            <p className="mb-1.5 text-sm font-medium">Add items (in the order you tick them)</p>
            <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
              {[...affs.map((a) => ({ it: { type: 'affirmation', id: a.id } as PlaylistItem, text: a.text, tag: a.audio_key ? 'your voice' : 'spoken' })),
                ...vizs.map((v) => ({ it: { type: 'visualization', id: v.id } as PlaylistItem, text: v.title, tag: `${v.duration_min} min script` }))].map(({ it, text, tag }) => (
                <label key={`${it.type}:${it.id}`} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                  <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={!!has(it)} onChange={() => toggle(it)} />
                  <span className="flex-1">{text}</span><span className="text-xs text-muted">{tag}</span>
                </label>
              ))}
              {affs.length + vizs.length === 0 && <p className="p-2 text-sm text-muted">Add affirmations or visualization scripts first.</p>}
            </div>
          </div>
          {(draft.items?.length ?? 0) > 0 && (
            <ol className="space-y-1 text-sm">
              {draft.items!.map((it, i) => (
                <li key={`${it.type}:${it.id}`} className="flex items-center gap-2"><span className="w-5 text-muted">{i + 1}.</span><span className="flex-1 truncate">{label(it)}</span>
                  {i > 0 && <IconButton icon="back" label="Move up" className="rotate-90" onClick={() => moveUp(i)} />}</li>
              ))}
            </ol>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--accent)]" checked={!!draft.loop} onChange={(e) => setDraft({ ...draft, loop: e.target.checked })} /> Repeat until the sleep timer ends</label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button disabled={!draft.title?.trim() || !draft.items?.length} onClick={async () => { await save({ ...draft, title: cleanText(draft.title ?? '', 120) }); setDraft(null) }}>Save playlist</Button>
          </div>
        </Card>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted">Combine affirmations and visualizations into one session.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => (
            <Card as="li" key={p.id} className="flex items-center gap-2 py-3 md:py-3">
              <span className="flex-1"><span className="font-medium">{p.title}</span> <span className="text-xs text-muted">· {p.items.length} items{p.loop ? ' · repeats' : ''}</span></span>
              <IconButton icon="edit" label="Edit playlist" onClick={() => setDraft(p)} />
              <IconButton icon="trash" label="Delete playlist" onClick={() => confirm(`Delete “${p.title}”?`) && remove(p.id)} />
            </Card>
          ))}
        </ul>
      )}
    </Section>
  )
}
