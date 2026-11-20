import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Chip, Progress } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useProfile } from '../../lib/hooks'
import { db } from '../../lib/store'
import { buildPlan, type GrowthPlan } from '../../lib/engine/plan'
import { suggestAffirmations } from '../../lib/engine/affirmations'
import type { Onboarding as OB } from '../../lib/types'
import { cleanText, uid } from '../../lib/util'

const EMPTY: OB = { goal: '', why: '', ideal_life: '', behaviors: '', obstacles: '', fears: '', habits_to_change: '', minutes_per_day: 15, constraints: '', progress_signal: '' }

const STEPS: { key: keyof OB; q: string; hint: string; placeholder: string }[] = [
  { key: 'goal', q: 'What do you want to achieve?', hint: 'One goal is plenty to start with.', placeholder: 'e.g. Become financially independent' },
  { key: 'why', q: 'Why does this matter to you?', hint: 'Personal reasons are more motivating than “shoulds”.', placeholder: 'e.g. So my family feels secure and I have more freedom' },
  { key: 'ideal_life', q: 'What would your life look like if you made real progress?', hint: 'Describe an ordinary day, concretely.', placeholder: 'e.g. I wake up calm about money and have savings for emergencies' },
  { key: 'behaviors', q: 'What would your future self do regularly?', hint: 'Separate with commas. These become your habits.', placeholder: 'e.g. track spending, read about investing, cook at home' },
  { key: 'obstacles', q: 'What currently gets in the way?', hint: 'Honest obstacles let us plan around them.', placeholder: 'e.g. impulse buying, I feel tired after work' },
  { key: 'fears', q: 'Any fears or limiting beliefs?', hint: 'Optional. Naming them makes them easier to work with.', placeholder: 'e.g. I’m just bad with money' },
  { key: 'habits_to_change', q: 'Which habits would you like to change?', hint: 'Optional.', placeholder: 'e.g. late-night online shopping' },
  { key: 'minutes_per_day', q: 'How much time can you realistically give each day?', hint: 'Small and consistent beats ambitious and abandoned.', placeholder: '' },
  { key: 'constraints', q: 'What responsibilities or limits should we respect?', hint: 'Work, caregiving, health, budget…', placeholder: 'e.g. full-time job, two kids' },
  { key: 'progress_signal', q: 'What would meaningful progress look like?', hint: 'A sign you could actually notice in a month or two.', placeholder: 'e.g. one month of expenses saved' },
]
const VALUES = ['security', 'freedom', 'health', 'family', 'growth', 'creativity', 'honesty', 'adventure', 'kindness', 'achievement', 'calm', 'community']

export default function Onboarding() {
  const nav = useNavigate()
  const { profile, saveProfile } = useProfile()
  const [a, setA] = useState<OB>(profile?.onboarding ?? EMPTY)
  const [values, setValues] = useState<string[]>(profile?.core_values ?? [])
  const [name, setName] = useState(profile?.display_name ?? '')
  const [step, setStep] = useState(0) // 0 = name, 1..N = questions, N+1 = values, N+2 = plan
  const [plan, setPlan] = useState<GrowthPlan | null>(null)
  const [saving, setSaving] = useState(false)
  const total = STEPS.length + 3

  const next = () => {
    window.scrollTo(0, 0)
    if (step === STEPS.length + 1) setPlan(buildPlan(a))
    setStep((s) => Math.min(total - 1, s + 1))
  }
  const back = () => (step === 0 ? nav('/') : setStep((s) => s - 1))
  const cur = STEPS[step - 1]

  async function apply() {
    if (!plan) return
    setSaving(true)
    const clean = Object.fromEntries(Object.entries(a).map(([k, v]) => [k, typeof v === 'string' ? cleanText(v) : v])) as unknown as OB
    await saveProfile({ display_name: cleanText(name, 80), onboarding: clean, core_values: values })
    const goals = await db.all('goals')
    const title = cleanText(a.goal, 200) || plan.focus
    let goal = goals.find((g) => g.title === title)
    if (!goal)
      goal = await db.save('goals', {
        title, category: plan.category, why: cleanText(a.why), identity_statement: plan.identity, target_date: null, status: 'active',
        milestones: plan.milestones.map((m) => ({ id: uid(), title: m, done: false })),
      })
    const habits = await db.all('habits')
    for (const h of plan.habits)
      if (!habits.some((x) => x.title === h.title))
        await db.save('habits', { goal_id: goal.id, title: h.title, cue: h.cue, minutes: h.minutes, days: [], active: true })
    const affs = await db.all('affirmations')
    if (!affs.some((x) => x.goal_id === goal!.id))
      for (const t of suggestAffirmations(plan.category, { behavior: a.behaviors.split(',')[0] }).slice(0, 3))
        await db.save('affirmations', { goal_id: goal.id, text: t, audio_key: null, is_favorite: false })
    nav('/')
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-6">
      <div className="mb-8 flex items-center gap-3">
        <button type="button" onClick={back} aria-label="Back" className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2"><Icon name="back" /></button>
        <Progress value={(step + 1) / total} label="Onboarding progress" />
        <Link to="/" className="text-sm text-muted">Exit</Link>
      </div>

      <div key={step} className="animate-rise flex-1">
        {step === 0 && (
          <>
            <h1 className="text-3xl">Let’s begin with you</h1>
            <p className="mt-2 text-muted">What should we call you? (Optional)</p>
            <input className="field mt-6" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" aria-label="Your name" maxLength={80} autoFocus />
            <p className="mt-6 text-sm text-muted">There are no right answers. You can edit everything later. Answers stay on this device unless you enable sync.</p>
          </>
        )}
        {cur && (
          <>
            <p className="text-sm text-accent">Question {step} of {STEPS.length}</p>
            <h1 className="mt-1 text-3xl leading-tight">{cur.q}</h1>
            <p className="mt-2 text-muted">{cur.hint}</p>
            {cur.key === 'minutes_per_day' ? (
              <div className="mt-8">
                <p className="text-center font-serif text-5xl">{a.minutes_per_day}<span className="text-xl text-muted"> min</span></p>
                <input type="range" min={5} max={120} step={5} value={a.minutes_per_day} aria-label="Minutes per day"
                  onChange={(e) => setA({ ...a, minutes_per_day: Number(e.target.value) })} className="mt-6 w-full accent-[var(--accent)]" />
              </div>
            ) : (
              <textarea className="field mt-6 min-h-32" value={a[cur.key] as string} placeholder={cur.placeholder} aria-label={cur.q} maxLength={2000} autoFocus
                onChange={(e) => setA({ ...a, [cur.key]: e.target.value })} />
            )}
          </>
        )}
        {step === STEPS.length + 1 && (
          <>
            <h1 className="text-3xl">What values matter most to you?</h1>
            <p className="mt-2 text-muted">Pick up to five. The Advisor uses these to reflect choices back to you.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {VALUES.map((v) => (
                <Chip key={v} active={values.includes(v)} onClick={() => setValues(values.includes(v) ? values.filter((x) => x !== v) : values.length < 5 ? [...values, v] : values)}>{v}</Chip>
              ))}
            </div>
          </>
        )}
        {step === STEPS.length + 2 && plan && (
          <>
            <p className="text-sm text-accent">Your growth plan · {plan.focus}</p>
            <h1 className="mt-1 text-3xl leading-tight">{plan.identity}</h1>
            <div className="mt-6 space-y-4">
              <Card>
                <h2 className="text-base">Daily actions</h2>
                <ul className="mt-2 space-y-2">
                  {plan.habits.map((h) => <li key={h.title} className="flex justify-between gap-3"><span>{h.title}<span className="block text-xs text-muted">{h.cue}</span></span><span className="text-sm text-muted">{h.minutes} min</span></li>)}
                </ul>
              </Card>
              <Card>
                <h2 className="text-base">If-then plans for obstacles</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{plan.intentions.map((i) => <li key={i}>{i}</li>)}</ul>
              </Card>
              <Card>
                <h2 className="text-base">WOOP</h2>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="font-medium">Wish</dt><dd>{plan.woop.wish}</dd>
                  <dt className="font-medium">Outcome</dt><dd>{plan.woop.outcome}</dd>
                  <dt className="font-medium">Obstacle</dt><dd>{plan.woop.obstacle}</dd>
                  <dt className="font-medium">Plan</dt><dd>{plan.woop.plan}</dd>
                </dl>
              </Card>
              <Card>
                <h2 className="text-base">Milestones</h2>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{plan.milestones.map((m) => <li key={m}>{m}</li>)}</ol>
              </Card>
              <p className="text-sm text-muted">{plan.note} Built from established ideas — implementation intentions, mental contrasting (WOOP), and identity-based habits. Progress isn’t guaranteed, but small consistent actions make it more likely.</p>
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 mt-8 flex justify-end gap-2 bg-gradient-to-t from-bg pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {step < total - 1 ? (
          <Button onClick={next} disabled={step === 1 && !a.goal.trim()}>{step === STEPS.length + 1 ? 'Create my plan' : 'Continue'}</Button>
        ) : (
          <Button onClick={apply} disabled={saving}>{saving ? 'Saving…' : 'Save plan'}</Button>
        )}
      </div>
    </div>
  )
}
