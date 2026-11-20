import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, Empty, Field, Notice, Page, Section, Segmented, cx } from '../../components/ui'
import { useCollection } from '../../lib/store'
import { AMBIENTS, createAmbient, type Ambient } from '../../lib/audio/ambient'
import { getVoices, narrate, ttsSupported } from '../../lib/audio/narrator'
import { recordingUrl } from '../../lib/audio/recorder'
import { fmtMinutes } from '../../lib/util'

type Source = 'none' | 'affirmations' | 'recordings' | string // string = visualization id
const TIMERS = [0, 10, 20, 30, 45, 60]

export default function NightAudio() {
  const [params] = useSearchParams()
  const vizs = useCollection('visualizations').rows
  const affs = useCollection('affirmations').rows
  const sessions = useCollection('audio_sessions')
  const recorded = affs.filter((a) => a.audio_key)

  const [source, setSource] = useState<Source>(params.get('viz') ?? (affs.length ? 'affirmations' : 'none'))
  const [ambient, setAmbient] = useState<Ambient>('rain')
  const [ambVol, setAmbVol] = useState(0.35)
  const [voiceVol, setVoiceVol] = useState(0.9)
  const [rate, setRate] = useState(0.85)
  const [voiceURI, setVoiceURI] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [timer, setTimer] = useState(20)
  const [playing, setPlaying] = useState(false)
  const [remaining, setRemaining] = useState(0)

  const amb = useRef(createAmbient())
  const narr = useRef<{ stop(): void } | null>(null)
  const audioEl = useRef<HTMLAudioElement | null>(null)
  const started = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const load = () => setVoices(getVoices())
    load()
    if (ttsSupported()) speechSynthesis.addEventListener?.('voiceschanged', load)
    const a = amb.current
    return () => {
      if (ttsSupported()) speechSynthesis.removeEventListener?.('voiceschanged', load)
      narr.current?.stop()
      audioEl.current?.pause()
      timers.current.forEach(clearTimeout)
      a.close()
    }
  }, [])
  useEffect(() => { amb.current.setVolume(ambVol) }, [ambVol])
  // Rows load async; default to affirmations once they arrive (unless a script was requested).
  useEffect(() => { if (!params.get('viz') && affs.length) setSource((s) => (s === 'none' ? 'affirmations' : s)) }, [affs.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (audioEl.current) audioEl.current.volume = voiceVol }, [voiceVol])
  useEffect(() => {
    if (!playing || !timer) return
    const id = setInterval(() => setRemaining(Math.max(0, timer * 60 - Math.round((Date.now() - started.current) / 1000))), 1000)
    return () => clearInterval(id)
  }, [playing, timer])

  const title = source === 'affirmations' ? 'Affirmations' : source === 'recordings' ? 'Your voice' : source === 'none' ? AMBIENTS.find((a) => a.value === ambient)!.label : vizs.find((v) => v.id === source)?.title ?? 'Session'

  function playRecordings(i = 0) {
    const a = recorded[i % recorded.length]
    if (!a?.audio_key) return
    recordingUrl(a.audio_key).then((url) => {
      if (!url) return
      audioEl.current = new Audio(url)
      audioEl.current.volume = voiceVol
      audioEl.current.onended = () => { URL.revokeObjectURL(url); timers.current.push(setTimeout(() => playRecordings(i + 1), 6000)) }
      audioEl.current.play().catch(() => {})
    })
  }

  function start() {
    started.current = Date.now()
    setPlaying(true)
    setRemaining(timer * 60)
    amb.current.play(ambient)
    const opts = { rate, volume: voiceVol, voiceURI, onEnd: () => {} }
    if (source === 'affirmations' && affs.length) {
      const script = affs.map((a) => `${a.text} [pause 8]`).join(' ')
      const loop = () => { narr.current = narrate(script, { ...opts, onEnd: () => timers.current.push(setTimeout(loop, 10000)) }) }
      loop()
    } else if (source === 'recordings') playRecordings()
    else if (source !== 'none') {
      const v = vizs.find((x) => x.id === source)
      if (v) narr.current = narrate(v.script, opts)
    }
    if (timer) timers.current.push(setTimeout(() => stop(true), timer * 60 * 1000))
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist: 'Future Self' })
      navigator.mediaSession.setActionHandler('pause', () => stop())
      navigator.mediaSession.setActionHandler('stop', () => stop())
    }
  }

  function stop(fade = false) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    narr.current?.stop()
    audioEl.current?.pause()
    if (fade) amb.current.fadeOut(8)
    else amb.current.stop()
    setPlaying(false)
    const secs = Math.round((Date.now() - started.current) / 1000)
    if (started.current && secs >= 15) sessions.save({ title, duration_s: secs })
    started.current = 0
  }

  const history = [...sessions.rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10)

  return (
    <Page title="Night audio" subtitle="Wind down with calm sound and gentle, personalized narration.">
      <Card className="relative overflow-hidden bg-gradient-to-b from-[#221d3a] to-[#14131a] text-[#eeecf4]">
        <div className="flex flex-col items-center py-6">
          <div className={cx('size-40 rounded-full bg-gradient-to-br from-[#a596f7] to-[#e9a07a] opacity-80 blur-[2px]', playing && 'animate-breathe')} aria-hidden="true" />
          <p className="mt-6 font-serif text-xl">{title}</p>
          <p className="text-sm text-white/60" aria-live="polite">{playing ? (timer ? `Stops in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : 'Playing') : 'Ready'}</p>
          <Button className="mt-6 !bg-white !text-[#1f1d2b]" icon={playing ? 'stop' : 'play'} onClick={() => (playing ? stop() : start())}>{playing ? 'Stop' : 'Play'}</Button>
          {playing && <p className="mt-3 text-xs text-white/50">Breathe with the circle: in as it grows, out as it shrinks.</p>}
        </div>
      </Card>

      <Section title="What to play">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Narration source">
          {[
            { v: 'none', l: 'Sound only' },
            ...(affs.length ? [{ v: 'affirmations', l: 'Affirmations (narrated)' }] : []),
            ...(recorded.length ? [{ v: 'recordings', l: 'Affirmations (your voice)' }] : []),
            ...vizs.map((v) => ({ v: v.id, l: `${v.title} · ${v.duration_min}m` })),
          ].map((o) => (
            <button key={o.v} type="button" role="radio" aria-checked={source === o.v} disabled={playing} onClick={() => setSource(o.v)}
              className={cx('rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50', source === o.v ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted')}>{o.l}</button>
          ))}
        </div>
      </Section>

      <Card className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">Background</p>
          <Segmented label="Background sound" value={ambient} onChange={(a) => { setAmbient(a); if (playing) amb.current.play(a) }} options={AMBIENTS} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium">Background volume
            <input type="range" min={0} max={1} step={0.05} value={ambVol} onChange={(e) => setAmbVol(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
          </label>
          <label className="text-sm font-medium">Voice volume
            <input type="range" min={0} max={1} step={0.05} value={voiceVol} disabled={playing && source !== 'recordings'} onChange={(e) => setVoiceVol(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
          </label>
          <label className="text-sm font-medium">Speaking pace
            <input type="range" min={0.6} max={1.1} step={0.05} value={rate} disabled={playing} onChange={(e) => setRate(Number(e.target.value))} className="mt-2 w-full accent-[var(--accent)]" />
          </label>
          {voices.length > 0 && (
            <Field label="Voice">{(id) => (
              <select id={id} className="field" value={voiceURI} disabled={playing} onChange={(e) => setVoiceURI(e.target.value)}>
                <option value="">System default</option>
                {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
              </select>)}</Field>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Sleep timer</p>
          <Segmented label="Sleep timer" value={timer} onChange={setTimer} options={TIMERS.map((t) => ({ value: t, label: t ? `${t}m` : 'Off' }))} />
        </div>
      </Card>

      <Notice tone="warn">
        Browser limits: speech narration usually stops when your phone screen locks or you switch apps (especially on iOS). For screen-off listening, record affirmations in your own voice, keep the screen on with low brightness, or install the app. Background sounds are generated on your device.
      </Notice>
      <p className="text-sm text-muted">Relaxation and mental rehearsal can support winding down and motivation. Listening while asleep has not been shown to “reprogram” the subconscious — the most useful part is the calm, intentional time before sleep.</p>

      <Section title="Recent sessions">
        {history.length === 0 ? <Empty icon="moon" title="No sessions yet" /> : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface/80">
            {history.map((s) => (
              <li key={s.id} className="flex justify-between px-4 py-2.5 text-sm">
                <span>{s.title}</span>
                <span className="text-muted">{fmtMinutes(Math.max(1, Math.round(s.duration_s / 60)))} · {new Date(s.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}
