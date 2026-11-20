import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Card, Empty, Field, IconButton, Notice, Page, Section, Segmented } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { useProfile } from '../../lib/hooks'
import { buildVisualization, stripPauses, type VizInput } from '../../lib/engine/visualization'
import { narrate, ttsSupported } from '../../lib/audio/narrator'
import { cleanText } from '../../lib/util'

export default function Visualize() {
  const [params] = useSearchParams()
  const goals = useCollection('goals').rows
  const { rows, save, remove } = useCollection('visualizations')
  const { profile } = useProfile()
  const ob = profile?.onboarding
  const goal = goals.find((g) => g.id === params.get('goal')) ?? goals[0]

  const [input, setInput] = useState<VizInput>(() => ({
    goal: goal?.title ?? ob?.goal ?? '',
    identity: goal?.identity_statement ?? '',
    behavior: ob?.behaviors.split(',')[0]?.trim() ?? '',
    obstacle: ob?.obstacles.split(',')[0]?.trim() ?? '',
    response: 'pause, take one slow breath, and start with the smallest step',
    place: '',
    duration_min: 5,
  }))
  const [script, setScript] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const ctl = useRef<{ stop(): void } | null>(null)
  useEffect(() => () => ctl.current?.stop(), [])

  const set = (p: Partial<VizInput>) => setInput({ ...input, ...p })
  const play = (id: string, s: string) => {
    ctl.current?.stop()
    if (playing === id) return setPlaying(null)
    setPlaying(id)
    ctl.current = narrate(s, { onEnd: () => setPlaying(null) })
  }
  const saveScript = async () => {
    const row = await save({ ...(editingId ? { id: editingId } : {}), goal_id: goal?.id ?? null, title: cleanText(input.goal || 'Visualization', 200), script: cleanText(script, 20000), duration_min: input.duration_min })
    setEditingId(row.id)
  }

  return (
    <Page title="Visualization studio" subtitle="Mentally rehearse the process — the actions, obstacles and responses — not just the finish line.">
      <Card>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Goal">{(id) => <input id={id} className="field" value={input.goal} onChange={(e) => set({ goal: e.target.value })} />}</Field>
            <Field label="Where will you practice?">{(id) => <input id={id} className="field" value={input.place} onChange={(e) => set({ place: e.target.value })} placeholder="e.g. my desk at home" />}</Field>
          </div>
          <Field label="The action you’ll rehearse">{(id) => <input id={id} className="field" value={input.behavior} onChange={(e) => set({ behavior: e.target.value })} placeholder="e.g. open my budget app and review the week" />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="A realistic obstacle">{(id) => <input id={id} className="field" value={input.obstacle} onChange={(e) => set({ obstacle: e.target.value })} />}</Field>
            <Field label="How you’ll respond">{(id) => <input id={id} className="field" value={input.response} onChange={(e) => set({ response: e.target.value })} />}</Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented label="Duration" value={input.duration_min} onChange={(d) => set({ duration_min: d })}
              options={[3, 5, 10, 15].map((d) => ({ value: d, label: `${d} min` }))} />
            <Button icon="sparkle" onClick={() => { setScript(buildVisualization(input)); setEditingId(null) }}>Generate script</Button>
          </div>
        </div>
      </Card>

      {script && (
        <Section title="Your script" action={<span className="text-xs text-muted">[pause N] = N seconds of silence</span>}>
          <Card className="space-y-3">
            <textarea className="field min-h-72 font-serif leading-relaxed" value={script} onChange={(e) => setScript(e.target.value)} aria-label="Visualization script" maxLength={20000} />
            <div className="flex flex-wrap justify-end gap-2">
              {ttsSupported() && <Button variant="soft" icon={playing === 'draft' ? 'stop' : 'play'} onClick={() => play('draft', script)}>{playing === 'draft' ? 'Stop' : 'Listen'}</Button>}
              <Button onClick={saveScript}>{editingId ? 'Saved ✓ — save again' : 'Save'}</Button>
            </div>
          </Card>
        </Section>
      )}

      {!ttsSupported() && <Notice tone="warn">Your browser doesn’t support speech synthesis — you can still read scripts or record them yourself.</Notice>}

      <Section title="Saved sessions">
        {rows.length === 0 ? <Empty icon="eye" title="No saved scripts yet">Generate one above, edit it to fit, and save it.</Empty> : (
          <ul className="space-y-2">
            {[...rows].reverse().map((v) => (
              <Card as="li" key={v.id} className="flex items-center gap-2 py-3 md:py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{v.title}</p>
                  <p className="truncate text-xs text-muted">{v.duration_min} min · {stripPauses(v.script).slice(0, 80)}…</p>
                </div>
                {ttsSupported() && <IconButton icon={playing === v.id ? 'stop' : 'play'} label={playing === v.id ? 'Stop' : 'Play'} active={playing === v.id} onClick={() => play(v.id, v.script)} />}
                <Link to={`/audio?viz=${v.id}`} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2" aria-label="Open in night audio" title="Open in night audio"><Icon name="moon" className="size-[18px]" /></Link>
                <IconButton icon="edit" label="Edit" onClick={() => { setScript(v.script); setEditingId(v.id); scrollTo({ top: 0, behavior: 'smooth' }) }} />
                <IconButton icon="trash" label="Delete" onClick={() => confirm('Delete this script?') && remove(v.id)} />
              </Card>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}
