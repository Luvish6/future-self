import type { Affirmation, Playlist, Visualization } from '../types'

export type Step = { kind: 'tts'; text: string; label: string } | { kind: 'audio'; key: string; label: string }

/** Resolve a playlist into playable steps; your own recording is preferred over TTS. Missing items are skipped. */
export function playlistSteps(pl: Pick<Playlist, 'items'>, affs: Affirmation[], vizs: Visualization[]): Step[] {
  const out: Step[] = []
  for (const it of pl.items) {
    if (it.type === 'affirmation') {
      const a = affs.find((x) => x.id === it.id)
      if (!a) continue
      out.push(a.audio_key ? { kind: 'audio', key: a.audio_key, label: a.text } : { kind: 'tts', text: `${a.text} [pause 4]`, label: a.text })
    } else {
      const v = vizs.find((x) => x.id === it.id)
      if (v) out.push({ kind: 'tts', text: v.script, label: v.title })
    }
  }
  return out
}
