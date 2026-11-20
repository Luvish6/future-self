import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from '../../components/ui'
import type { VisionItem } from '../../lib/types'

/** Full-screen, calm slideshow of a board. Keyboard: ←/→ to move, space to pause, Esc to close. */
export function Slideshow({ items, title, onClose }: { items: VisionItem[]; title: string; onClose: () => void }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const go = useCallback((d: number) => setI((x) => (x + d + items.length) % items.length), [items.length])

  useEffect(() => {
    if (paused || items.length < 2) return
    const t = setTimeout(() => go(1), 7000)
    return () => clearTimeout(t)
  }, [i, paused, go, items.length])
  useEffect(() => {
    ref.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const it = items[i]
  if (!it) return null
  return createPortal(
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${title} slideshow`}
      className="fixed inset-0 z-50 flex flex-col bg-[#0d0c12] text-[#eeecf4] outline-none"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
        else if (e.key === 'ArrowRight') go(1)
        else if (e.key === 'ArrowLeft') go(-1)
        else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p) }
      }}>
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/70">
        <span>{title} · {i + 1}/{items.length}</span>
        <IconButton icon="x" label="Close slideshow" onClick={onClose} className="text-white/80 hover:bg-white/10" />
      </div>
      <div key={it.id} className="animate-rise flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-6" aria-live="polite">
        {it.image && <img src={it.image} alt={it.text || 'Vision board image'} className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-2xl" />}
        {it.text && (
          <p className={it.kind === 'quote' ? 'max-w-2xl text-center font-serif text-2xl italic leading-snug md:text-4xl' : 'max-w-2xl text-center font-serif text-xl leading-relaxed md:text-2xl'}>
            {it.kind === 'milestone' && <span className="mb-2 block text-xs uppercase tracking-widest text-white/60">Milestone</span>}
            {it.kind === 'quote' ? `“${it.text}”` : it.text}
          </p>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <IconButton icon="back" label="Previous" onClick={() => go(-1)} className="text-white/80 hover:bg-white/10" />
        <IconButton icon={paused ? 'play' : 'pause'} label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused(!paused)} className="text-white/80 hover:bg-white/10" />
        <IconButton icon="arrow" label="Next" onClick={() => go(1)} className="text-white/80 hover:bg-white/10" />
      </div>
    </div>,
    document.body,
  )
}
