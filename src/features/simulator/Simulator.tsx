import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Chip, Field, IconButton, Notice, Page, Progress } from '../../components/ui'
import { GoalScopeBar, useGoalScope } from '../../components/GoalScope'
import { useCollection } from '../../lib/store'
import { obstaclesFor, responseFor, suggestedWords, summarize, toVizInput, type Simulation } from '../../lib/engine/simulator'
import { buildVisualization } from '../../lib/engine/visualization'
import { isCrisis, CRISIS_MESSAGE } from '../../lib/engine/safety'
import { cleanText } from '../../lib/util'

const STEPS = ['Situation', 'Imagine it', 'Obstacles', 'Responses', 'What to say', 'Real action'] as const
const EMPTY: Simulation = { situation: '', when: '', place: '', people: '', showUpAs: '', obstacles: [], responses: {}, words: '', action: '', actionWhen: '' }

export default function Simulator() {
  const scope = useGoalScope()
  const journal = useCollection('journal_entries')
  const vizs = useCollection('visualizations')
  const [s, setS] = useState<Simulation>(EMPTY)
  const [step, setStep] = useState(0)
  const [custom, setCustom] = useState('')
  const [done, setDone] = useState<{ vizId?: string } | null>(null)
  const set = (p: Partial<Simulation>) => setS({ ...s, ...p })
  const crisis = isCrisis(s.situation)

  const next = () => {
    if (step === 2 && !s.words) set({ words: suggestedWords(s.situation) })
    setStep(step + 1)
    window.scrollTo(0, 0)
  }
  const toggleObstacle = (o: string) => set({ obstacles: s.obstacles.includes(o) ? s.obstacles.filter((x) => x !== o) : [...s.obstacles, o] })
  const clean = (): Simulation => ({
    ...s, situation: cleanText(s.situation, 500), when: cleanText(s.when, 80), place: cleanText(s.place, 120), people: cleanText(s.people, 120),
    showUpAs: cleanText(s.showUpAs, 200), obstacles: s.obstacles.map((o) => cleanText(o, 200)).slice(0, 6), words: cleanText(s.words, 2000),
    action: cleanText(s.action, 300), actionWhen: cleanText(s.actionWhen, 80),
    responses: Object.fromEntries(Object.entries(s.responses).map(([k, v]) => [k, cleanText(v, 300)])),
  })
  const save = async (withScript: boolean) => {
    const c = clean()
    await journal.save({ kind: 'simulation', goal_id: scope.goal?.id ?? null, title: `Rehearsal: ${c.situation.slice(0, 80)}`, body: summarize(c), mood: null, open_on: null })
    let vizId: string | undefined
    if (withScript) {
      const input = toVizInput(c, scope.goal?.title ?? '', scope.goal?.identity_statement ?? '')
      vizId = (await vizs.save({ goal_id: scope.goal?.id ?? null, title: `Rehearsal: ${c.situation.slice(0, 60)}`, script: buildVisualization(input), duration_min: 5 })).id
    }
    setDone({ vizId })
  }

  if (done)
    return (
      <Page title="Rehearsal saved" subtitle="You’ve prepared. Now the real step matters most.">
        <Card className="space-y-3">
          <p className="font-serif text-xl">Your real-world action: {s.action}{s.actionWhen && ` — ${s.actionWhen}`}</p>
          <p className="text-sm text-muted">Rehearsal builds readiness, but it isn’t a substitute for the real experience. Afterwards, record what happened in your Evidence Journal.</p>
          <div className="flex flex-wrap gap-2">
            {done.vizId && <Link to={`/audio?viz=${done.vizId}${scope.goal ? `&goal=${scope.goal.id}` : ''}`} className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm text-accent-ink">Listen to the rehearsal</Link>}
            <Link to={`/journal?new=evidence${scope.goal ? `&goal=${scope.goal.id}` : ''}`} className="inline-flex items-center rounded-full bg-accent-soft px-4 py-2 text-sm text-accent">Log evidence afterwards</Link>
            <Button variant="ghost" onClick={() => { setS(EMPTY); setStep(0); setDone(null) }}>Rehearse something else</Button>
          </div>
        </Card>
      </Page>
    )

  const canNext = [s.situation.trim() && !crisis, true, s.obstacles.length > 0, true, true, s.action.trim()][step]
  const sugg = obstaclesFor(s.situation)
  return (
    <Page title="Future Self Simulator" subtitle="Rehearse a real situation so you can meet it as the person you’re becoming.">
      <GoalScopeBar scope={scope} />
      <div>
        <div className="mb-2 flex justify-between text-sm text-muted"><span>Step {step + 1} of {STEPS.length}: {STEPS[step]}</span></div>
        <Progress value={(step + 1) / STEPS.length} label="Simulator progress" />
      </div>
      <Card key={step} className="animate-rise space-y-4">
        {step === 0 && (
          <>
            <Field label="What’s coming up?">{(id) => <textarea id={id} className="field min-h-24" autoFocus maxLength={500} value={s.situation} onChange={(e) => set({ situation: e.target.value })} placeholder="e.g. I want to become confident, but I have a presentation tomorrow." />}</Field>
            <Field label="When? (optional)">{(id) => <input id={id} className="field" maxLength={80} value={s.when} onChange={(e) => set({ when: e.target.value })} placeholder="e.g. Tomorrow at 10am" />}</Field>
            {crisis && <Notice tone="warn">{CRISIS_MESSAGE}</Notice>}
          </>
        )}
        {step === 1 && (
          <>
            <p className="text-muted">Picture it concretely — the more specific, the more useful the rehearsal.</p>
            <Field label="Where will it happen?">{(id) => <input id={id} className="field" maxLength={120} value={s.place} onChange={(e) => set({ place: e.target.value })} placeholder="e.g. the meeting room" />}</Field>
            <Field label="Who’s there?">{(id) => <input id={id} className="field" maxLength={120} value={s.people} onChange={(e) => set({ people: e.target.value })} placeholder="e.g. my team and my manager" />}</Field>
            <Field label="How do you want to show up?" hint={scope.goal?.identity_statement}>{(id) => <input id={id} className="field" maxLength={200} value={s.showUpAs} onChange={(e) => set({ showUpAs: e.target.value })} placeholder="e.g. calm, clear and prepared" />}</Field>
          </>
        )}
        {step === 2 && (
          <>
            <p className="text-muted">What could realistically get in the way? Pick any that fit, or add your own.</p>
            <div className="flex flex-wrap gap-2">{[...new Set([...sugg, ...s.obstacles])].map((o) => <Chip key={o} active={s.obstacles.includes(o)} onClick={() => toggleObstacle(o)}>{o}</Chip>)}</div>
            <div className="flex gap-2">
              <input className="field" value={custom} maxLength={200} onChange={(e) => setCustom(e.target.value)} placeholder="Add an obstacle" aria-label="Add an obstacle"
                onKeyDown={(e) => { if (e.key === 'Enter' && custom.trim()) { e.preventDefault(); toggleObstacle(custom.trim()); setCustom('') } }} />
              <Button variant="soft" icon="plus" disabled={!custom.trim()} onClick={() => { toggleObstacle(custom.trim()); setCustom('') }}>Add</Button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p className="text-muted">Plan a constructive response for each obstacle — an if-then plan.</p>
            {s.obstacles.map((o) => (
              <Field key={o} label={`If ${o.toLowerCase()}, then I will…`}>{(id) => (
                <input id={id} className="field" maxLength={300} value={s.responses[o] ?? responseFor(o)} onChange={(e) => set({ responses: { ...s.responses, [o]: e.target.value } })} />
              )}</Field>
            ))}
          </>
        )}
        {step === 4 && (
          <>
            <Field label="Practise what you’ll say" hint="Edit these into your own words, then say them out loud a couple of times.">{(id) => (
              <textarea id={id} className="field min-h-32" maxLength={2000} value={s.words} onChange={(e) => set({ words: e.target.value })} />
            )}</Field>
          </>
        )}
        {step === 5 && (
          <>
            <Field label="One real-world action you’ll take">{(id) => <input id={id} className="field" autoFocus maxLength={300} value={s.action} onChange={(e) => set({ action: e.target.value })} placeholder="e.g. Rehearse my opening out loud twice, then give the presentation" />}</Field>
            <Field label="When?">{(id) => <input id={id} className="field" maxLength={80} value={s.actionWhen} onChange={(e) => set({ actionWhen: e.target.value })} placeholder="e.g. Tonight at 8pm" />}</Field>
            <details className="rounded-xl bg-surface-2/60 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium">Preview your plan</summary>
              <pre className="mt-2 whitespace-pre-wrap font-sans">{summarize(clean())}</pre>
            </details>
          </>
        )}
      </Card>
      <div className="flex items-center justify-between gap-2">
        <span>{step > 0 && <IconButton icon="back" label="Previous step" onClick={() => setStep(step - 1)} />}</span>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canNext}>Continue</Button>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="soft" disabled={!canNext} onClick={() => save(false)}>Save plan</Button>
            <Button disabled={!canNext} onClick={() => save(true)}>Save + create audio rehearsal</Button>
          </div>
        )}
      </div>
    </Page>
  )
}
