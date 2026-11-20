import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Chip, Notice, Page } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { GoalScopeBar, useGoalScope } from '../../components/GoalScope'
import { useCollection } from '../../lib/store'
import { useProfile } from '../../lib/hooks'
import { advise, type AdvisorReply } from '../../lib/engine/advisor'
import { FOLLOW_UPS, followUp, type FollowUp } from '../../lib/engine/guidance'
import { cleanText } from '../../lib/util'

type Msg = { id: number; q: string; r: AdvisorReply; saved?: boolean; follow: { kind: FollowUp; title: string; lines: string[] }[] }

const EXAMPLES = [
  'I feel ignored by someone important to me. How would my future self respond?',
  'I’m afraid to speak in a meeting.',
  'I’m tempted to spend money impulsively.',
  'I’m struggling to set boundaries.',
  'I received a rejection and feel discouraged.',
]

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  )
}

export default function Advisor() {
  const scope = useGoalScope()
  const all = useCollection('goals').rows.filter((g) => g.status === 'active')
  const goals = scope.goal ? [scope.goal] : all
  const journal = useCollection('journal_entries')
  const { profile } = useProfile()
  const [q, setQ] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (msgs.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs.length])

  const ask = (text: string) => {
    const clean = cleanText(text, 1000)
    if (!clean) return
    const r = advise(clean, { goals, values: profile?.core_values ?? [], obstacles: profile?.onboarding?.obstacles ?? '' })
    setMsgs((m) => [...m, { id: Date.now(), q: clean, r, follow: [] }])
    setQ('')
  }
  const addFollow = (id: number, kind: FollowUp) =>
    setMsgs((all) => all.map((m) => (m.id === id && !m.follow.some((f) => f.kind === kind) ? { ...m, follow: [...m.follow, { kind, ...followUp(m.r.intent, kind) }] } : m)))

  const saveToJournal = async (m: Msg) => {
    const g = m.r.guidance
    const body = [
      `Situation: ${m.q}`,
      g && `How my future self might see it: ${g.interpret}`,
      g && `Settle first: ${g.regulate}`,
      g && `Healthy response: ${g.healthy}`,
      g && `Boundaries: ${g.boundaries}`,
      g && `Words I could use:\n${g.say.map((s) => `• ${s}`).join('\n')}`,
      g && `Avoid:\n${g.avoid.map((s) => `• ${s}`).join('\n')}`,
      `Questions:\n${m.r.questions.map((x) => `• ${x}`).join('\n')}`,
      ...m.follow.map((f) => `${f.title}:\n${f.lines.map((l) => `• ${l}`).join('\n')}`),
      `One small step: ${m.r.nextStep}`,
      'My thoughts:\n',
    ].filter(Boolean).join('\n\n')
    await journal.save({ kind: 'reflection', goal_id: scope.goal?.id ?? null, title: `Advisor: ${m.q.slice(0, 80)}`, mood: null, open_on: null, body })
    setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, saved: true } : x)))
  }

  return (
    <Page title="Future Self Advisor" subtitle="Describe a real situation. Think it through as the person you’re becoming.">
      <GoalScopeBar scope={scope} />
      <Notice>
        <strong>Structured guidance, not AI.</strong> Responses come from established coaching and psychology frameworks, filled in with your goals. They run on your device, can’t know your future or other people’s minds, and aren’t professional advice. You decide what fits.
      </Notice>
      {goals.length === 0 && <p className="text-sm text-muted">Tip: <Link className="text-accent" to="/goals/new">create a goal</Link> so guidance reflects who you’re becoming.</p>}

      {msgs.length === 0 && <div className="flex flex-wrap gap-2">{EXAMPLES.map((e) => <Chip key={e} onClick={() => ask(e)}>{e}</Chip>)}</div>}

      <div className="space-y-6" aria-live="polite">
        {msgs.map((m) => {
          const g = m.r.guidance
          return (
            <div key={m.id} className="space-y-3">
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-accent-ink">{m.q}</p>
              <Card className="space-y-4">
                {m.r.crisis || !g ? (
                  <p role="alert" className="font-medium">{m.r.summary}</p>
                ) : (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wider text-accent">{m.r.framework} · structured guidance</p>
                    <p className="font-serif text-lg leading-snug">{g.interpret}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Block title="Settle first">{g.regulate}</Block>
                      <Block title="A healthy response">{g.healthy}</Block>
                      <Block title="Boundaries">{g.boundaries}</Block>
                      <Block title="Avoid acting on impulse">
                        <ul className="list-disc space-y-0.5 pl-5">{g.avoid.map((a) => <li key={a}>{a}</li>)}</ul>
                      </Block>
                    </div>
                    <details className="rounded-xl bg-surface-2/60 px-4 py-3">
                      <summary className="cursor-pointer text-sm font-semibold">Example words (optional)</summary>
                      <ul className="mt-2 space-y-1 text-[15px]">{g.say.map((s) => <li key={s}>{s}</li>)}</ul>
                    </details>
                    <Block title="Questions to consider">
                      <ul className="list-disc space-y-0.5 pl-5">{m.r.questions.map((x) => <li key={x}>{x}</li>)}</ul>
                    </Block>
                    <p className="flex gap-2 rounded-xl bg-accent-soft px-4 py-3 text-[15px]"><Icon name="arrow" className="mt-0.5 size-4 shrink-0 text-accent" /><span><strong>One small step: </strong>{m.r.nextStep}</span></p>
                    {m.follow.map((f) => (
                      <div key={f.kind} className="border-l-2 border-accent pl-4">
                        <p className="text-sm font-semibold">{f.title}</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[15px]">{f.lines.map((l) => <li key={l}>{l}</li>)}</ul>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Follow-up questions">
                      {FOLLOW_UPS.filter((f) => !m.follow.some((x) => x.kind === f.id)).map((f) => <Chip key={f.id} onClick={() => addFollow(m.id, f.id)}>{f.label}</Chip>)}
                    </div>
                  </>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                  <p className="text-xs text-muted">{m.r.disclaimer} The choice is yours.</p>
                  {!m.r.crisis && <Button size="sm" variant="soft" icon="book" disabled={m.saved} onClick={() => saveToJournal(m)}>{m.saved ? 'Saved to journal' : 'Save this'}</Button>}
                </div>
              </Card>
            </div>
          )
        })}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(q) }} className="sticky bottom-20 flex gap-2 rounded-full border border-line bg-surface p-1.5 shadow-lg md:bottom-6">
        <input className="min-w-0 flex-1 bg-transparent px-4 outline-none" value={q} onChange={(e) => setQ(e.target.value)} maxLength={1000}
          placeholder={msgs.length ? 'Describe another situation…' : 'What’s happening?'} aria-label="Describe your situation" />
        <Button type="submit" disabled={!q.trim()}>Ask</Button>
      </form>
    </Page>
  )
}
