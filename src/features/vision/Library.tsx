import { useState } from 'react'
import { Button, Card, Chip, Segmented, cx } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { LIBRARY, libraryCategories, searchLibrary, type LibraryImage } from '../../content/library'
import { CATEGORY_LABEL } from '../../lib/engine/categorize'
import { suggestAffirmations } from '../../lib/engine/affirmations'
import type { Category } from '../../lib/types'
import { assetUrl } from '../../lib/util'

const CATS = libraryCategories(LIBRARY)

/** Built-in CC0 photos + generated mood cards. Multi-select, then add to the current board. */
export function LibraryPanel({ category, onAddImages, onAddCards, onClose }: {
  category: Category
  onAddImages: (imgs: LibraryImage[]) => Promise<void>
  onAddCards: (texts: string[]) => Promise<void>
  onClose: () => void
}) {
  const [tab, setTab] = useState<'photos' | 'cards'>('photos')
  const [cat, setCat] = useState<Category | null>(CATS.includes(category) ? category : null)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const photos = searchLibrary(LIBRARY, cat, q)
  const cards = suggestAffirmations(cat ?? category)
  const toggle = (k: string) => setPicked(picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k])
  const switchTab = (t: 'photos' | 'cards') => { setTab(t); setPicked([]) }

  const add = async () => {
    setBusy(true)
    if (tab === 'photos') await onAddImages(LIBRARY.filter((i) => picked.includes(i.file)))
    else await onAddCards(picked)
    setBusy(false)
    setPicked([])
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Segmented label="Library type" value={tab} onChange={switchTab} options={[{ value: 'photos', label: 'Photos' }, { value: 'cards', label: 'Mood cards' }]} />
        <Button size="sm" variant="ghost" icon="x" onClick={onClose}>Close</Button>
      </div>
      <div role="group" aria-label="Library category" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <Chip active={!cat} onClick={() => setCat(null)}>All</Chip>
        {CATS.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}><span className="whitespace-nowrap">{CATEGORY_LABEL[c]}</span></Chip>)}
      </div>

      {tab === 'photos' ? (
        <>
          <input type="search" className="field" placeholder="Search (e.g. family, books, lake)" aria-label="Search images" value={q} onChange={(e) => setQ(e.target.value)} />
          {photos.length === 0 ? <p className="text-sm text-muted">No photos match. Try Mood cards, or upload your own photo.</p> : (
            <ul className="grid max-h-[26rem] grid-cols-3 gap-2 overflow-y-auto md:grid-cols-4">
              {photos.map((p) => {
                const on = picked.includes(p.file)
                return (
                  <li key={p.file}>
                    <button type="button" aria-pressed={on} onClick={() => toggle(p.file)} title={`${p.title} — ${p.creator}, ${p.license} via ${p.source}`}
                      className={cx('relative block aspect-square w-full overflow-hidden rounded-xl ring-offset-2 ring-offset-surface transition', on ? 'ring-2 ring-accent' : 'hover:opacity-90')}>
                      <img src={assetUrl(p.file)} alt={p.title} loading="lazy" className="size-full object-cover" />
                      {on && <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-accent text-accent-ink"><Icon name="check" className="size-4" /></span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-xs text-muted">Public-domain (CC0) photos from StockSnap, bundled with the app — no tracking or external requests. <a className="underline" href={assetUrl('/library/LICENSES.json')} target="_blank" rel="noreferrer">Credits & licenses</a></p>
        </>
      ) : (
        <ul className="space-y-2">
          {cards.map((t) => {
            const on = picked.includes(t)
            return (
              <li key={t}>
                <button type="button" aria-pressed={on} onClick={() => toggle(t)}
                  className={cx('w-full rounded-xl bg-gradient-to-br from-accent-soft to-surface-2 px-4 py-3 text-left font-serif italic transition', on ? 'ring-2 ring-accent' : 'hover:brightness-95')}>
                  “{t}”
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex justify-end">
        <Button icon="plus" disabled={!picked.length || busy} onClick={add}>{busy ? 'Adding…' : `Add ${picked.length || ''} to board`}</Button>
      </div>
    </Card>
  )
}
