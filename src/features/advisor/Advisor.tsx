import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Chip, Notice, Page } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useCollection } from '../../lib/store'
import { useProfile } from '../../lib/hooks'
import { advise, type AdvisorReply } from '../../lib/engine/advisor'
import { cleanText } from '../../lib/util'

type Msg = { id: number; q: string; r: AdvisorReply; saved?: boolean }

const EXAMPLES = [
  'I want to buy something expensive. What would my future self consider?',
  'I keep putting off my most important task.',
  'I have a difficult conversation coming up.',
  'I missed my habit three days in a row.',
  'Should I accept a new job offer?',
]

export default function Advisor() {
  const goals = useCollection('goals').rows.filter((g) => g.status === 'active')
  const journal = useCollection('journal_entries')
  const { profile } = useProfile()
  const [q, setQ] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (msgs.length) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs])

  const ask = (text: string) => {
    const clean = cleanText(text, 1000)
    if (!clean) return
    const r = advise(clean, { goals, values: profile?.core_values ?? [], obstacles: profile?.onboarding?.obstacles ?? '' })
    setMsgs((m) => [...m, { id: Date.now(), q: clean, r }])
    setQ('')
  }
  const saveToJournal = async (m: Msg) => {
    await journal.save({
      kind: 'reflection', title: `Advisor: ${m.q.slice(0, 80)}`, mood: null, open_on: null,
      body: `Question: ${m.q}\n\nQuestions to consider:\n${m.r.questions.map((x) => `• ${x}`).join('\n')}\n\nOptions:\n${m.r.options.map((x) => `• ${x}`).join('\n')}\n\nMy thoughts:\n`,
    })
    setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, saved: true } : x)))
  }

  return (
    <Page title="Future Self Advisor" subtitle="Think through decisions from the perspective of who you want to become.">
      <Notice>This is a structured reflection tool built on decision frameworks and your own goals — not a real future version of you, and not professional advice. It runs entirely on your device; nothing is sent to an AI service.</Notice>
      {goals.length === 0 && <p className="text-sm text-muted">Tip: <Link className="text-accent" to="/onboarding">complete onboarding</Link> so guidance reflects your goals and values.</p>}

      {msgs.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => <Chip key={e} onClick={() => ask(e)}>{e}</Chip>)}
        </div>
      )}

      <div className="space-y-5" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className="space-y-3">
            <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-accent-ink">{m.q}</p>
            <Card className="max-w-[95%] space-y-4">
              {m.r.crisis ? (
                <p role="alert" className="font-medium">{m.r.summary}</p>
              ) : (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-accent">{m.r.framework}</p>
                  <p>{m.r.summary}</p>
                  <div>
                    <p className="mb-1.5 font-medium">Questions to sit with</p>
                    <ul className="list-disc space-y-1 pl-5 text-[15px]">{m.r.questions.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div>
                    <p className="mb-1.5 font-medium">Practical options</p>
                    <ul className="space-y-1.5 text-[15px]">{m.r.options.map((x) => <li key={x} className="flex gap-2"><Icon name="arrow" className="mt-1 size-4 shrink-0 text-accent" />{x}</li>)}</ul>
                  </div>
                  <p className="text-[15px]"><span className="font-medium">Next step: </span>{m.r.nextStep}</p>
                </>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <p className="text-xs text-muted">{m.r.disclaimer} The choice is yours.</p>
                {!m.r.crisis && <Button size="sm" variant="soft" icon="book" disabled={m.saved} onClick={() => saveToJournal(m)}>{m.saved ? 'Saved' : 'Reflect in journal'}</Button>}
              </div>
            </Card>
          </div>
        ))}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(q) }}
        className="sticky bottom-20 flex gap-2 rounded-full border border-line bg-surface p-1.5 shadow-lg md:bottom-6">
        <input className="min-w-0 flex-1 bg-transparent px-4 outline-none" value={q} onChange={(e) => setQ(e.target.value)} maxLength={1000}
          placeholder="What decision are you facing?" aria-label="Your question" />
        <Button type="submit" disabled={!q.trim()}>Ask</Button>
      </form>
    </Page>
  )
}
