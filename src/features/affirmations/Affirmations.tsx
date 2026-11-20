import { useEffect, useRef, useState } from 'react'
import { Button, Card, Chip, Empty, Field, IconButton, Notice, Page, Section } from '../../components/ui'
import { useCollection } from '../../lib/store'
import { useProfile } from '../../lib/hooks'
import { credibilityHint, suggestAffirmations } from '../../lib/engine/affirmations'
import { deleteRecording, recordingSupported, recordingUrl, saveRecording, startRecording } from '../../lib/audio/recorder'
import { getReminder, setReminder } from '../../lib/reminders'
import type { Affirmation } from '../../lib/types'
import { cleanText } from '../../lib/util'

function RecordButton({ a }: { a: Affirmation }) {
  const { save } = useCollection('affirmations')
  const [rec, setRec] = useState<Awaited<ReturnType<typeof startRecording>> | null>(null)
  const [err, setErr] = useState('')
  if (!recordingSupported()) return null
  const toggle = async () => {
    setErr('')
    try {
      if (rec) {
        const blob = await rec.stop()
        setRec(null)
        if (a.audio_key) await deleteRecording(a.audio_key)
        await save({ id: a.id, audio_key: await saveRecording(blob) })
      } else setRec(await startRecording(60))
    } catch {
      setErr('Microphone unavailable or permission denied.')
      setRec(null)
    }
  }
  return (
    <>
      <IconButton icon={rec ? 'stop' : 'mic'} label={rec ? 'Stop recording' : a.audio_key ? 'Re-record in your voice' : 'Record in your voice'} onClick={toggle} active={!!rec} className={rec ? 'animate-pulse' : ''} />
      {err && <span role="alert" className="text-xs text-danger">{err}</span>}
    </>
  )
}

function PlayButton({ audioKey }: { audioKey: string }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => () => { if (ref.current) { ref.current.pause(); URL.revokeObjectURL(ref.current.src) } }, [])
  const toggle = async () => {
    if (playing) { ref.current?.pause(); setPlaying(false); return }
    const url = await recordingUrl(audioKey)
    if (!url) return
    ref.current?.pause()
    ref.current = new Audio(url)
    ref.current.onended = () => setPlaying(false)
    await ref.current.play()
    setPlaying(true)
  }
  return <IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause recording' : 'Play your recording'} onClick={toggle} active={playing} />
}

export default function Affirmations() {
  const { rows, save, remove } = useCollection('affirmations')
  const goals = useCollection('goals').rows
  const { profile } = useProfile()
  const [goalId, setGoalId] = useState<string | null>(goals[0]?.id ?? null)
  const [text, setText] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [reminder, setRem] = useState(getReminder())
  const goal = goals.find((g) => g.id === goalId)
  const hint = credibilityHint(text)
  const suggestions = suggestAffirmations(goal?.category ?? 'general', {
    behavior: profile?.onboarding?.behaviors.split(',')[0],
    obstacle: profile?.onboarding?.obstacles.split(',')[0],
  }).filter((s) => !rows.some((r) => r.text === s))

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const t = cleanText(text, 500)
    if (!t) return
    await save(editId ? { id: editId, text: t } : { text: t, goal_id: goalId, audio_key: null, is_favorite: false })
    setText('')
    setEditId(null)
  }
  const updateReminder = async (r: typeof reminder) => {
    if (r.enabled && typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission()
    setReminder(r)
    setRem(r)
  }

  const groups = [...goals.map((g) => ({ id: g.id as string | null, title: g.title })), { id: null, title: 'General' }]
    .map((g) => ({ ...g, items: rows.filter((r) => (r.goal_id ?? null) === g.id || (g.id === null && r.goal_id && !goals.some((x) => x.id === r.goal_id))) }))
    .filter((g) => g.items.length)

  return (
    <Page title="Affirmations" subtitle="Believable statements that point you toward who you’re becoming.">
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <Field label={editId ? 'Edit affirmation' : 'Write your own'}>{(id) => <textarea id={id} className="field min-h-20" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="I’m learning to…" />}</Field>
          {hint && <Notice tone="warn">{hint}</Notice>}
          {!editId && goals.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Attach to goal">
              {goals.map((g) => <Chip key={g.id} active={goalId === g.id} onClick={() => setGoalId(g.id)}>{g.title}</Chip>)}
              <Chip active={goalId === null} onClick={() => setGoalId(null)}>General</Chip>
            </div>
          )}
          <div className="flex justify-end gap-2">
            {editId && <Button variant="ghost" onClick={() => { setEditId(null); setText('') }}>Cancel</Button>}
            <Button type="submit" disabled={!text.trim()}>{editId ? 'Update' : 'Save'}</Button>
          </div>
        </form>
      </Card>

      {suggestions.length > 0 && (
        <Section title="Suggestions for you">
          <ul className="space-y-2">
            {suggestions.slice(0, 4).map((s) => (
              <li key={s} className="flex items-center gap-2 rounded-xl bg-surface-2/60 px-4 py-2.5 text-sm">
                <span className="flex-1">{s}</span>
                <Button size="sm" variant="soft" icon="plus" onClick={() => save({ text: s, goal_id: goalId, audio_key: null, is_favorite: false })}>Add</Button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {rows.length === 0 ? <Empty icon="sparkle" title="No affirmations yet">Add one above or pick a suggestion.</Empty> : groups.map((g) => (
        <Section key={g.id ?? 'general'} title={g.title}>
          <ul className="space-y-2">
            {g.items.map((a) => (
              <Card as="li" key={a.id} className="flex items-center gap-2 py-3 md:py-3">
                <p className="flex-1 font-serif text-[17px] leading-snug">{a.text}</p>
                {a.audio_key && <PlayButton audioKey={a.audio_key} />}
                <RecordButton a={a} />
                <IconButton icon="star" label={a.is_favorite ? 'Unfavorite' : 'Favorite'} active={a.is_favorite} onClick={() => save({ id: a.id, is_favorite: !a.is_favorite })} />
                <IconButton icon="edit" label="Edit" onClick={() => { setEditId(a.id); setText(a.text); scrollTo({ top: 0, behavior: 'smooth' }) }} />
                <IconButton icon="trash" label="Delete" onClick={async () => { if (confirm('Delete this affirmation?')) { if (a.audio_key) await deleteRecording(a.audio_key); await remove(a.id) } }} />
              </Card>
            ))}
          </ul>
        </Section>
      ))}

      <Section title="Daily reminder">
        <Card className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={reminder.enabled} onChange={(e) => updateReminder({ ...reminder, enabled: e.target.checked })} />
            <span>Remind me at</span>
            <input type="time" className="field w-auto" value={reminder.time} aria-label="Reminder time" onChange={(e) => updateReminder({ ...reminder, time: e.target.value })} />
          </label>
          <p className="text-xs text-muted">Reminders appear only while Future Self is open or installed and running in the background — there’s no server sending push messages. Recordings stay on this device.</p>
        </Card>
      </Section>
    </Page>
  )
}
