import { toSegments } from '../engine/visualization'

export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

export function getVoices(): SpeechSynthesisVoice[] {
  return ttsSupported() ? speechSynthesis.getVoices() : []
}

export interface NarrateOpts {
  rate?: number
  pitch?: number
  volume?: number
  voiceURI?: string
  onProgress?: (index: number, total: number) => void
  onEnd?: () => void
}

/**
 * Speak a script with [pause N] markers. Uses timers for pauses because SSML is not supported.
 * Limitations: most mobile browsers stop speech when the screen locks or the tab is backgrounded.
 */
export function narrate(script: string, o: NarrateOpts = {}) {
  const segs = toSegments(script)
  let i = 0
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const voice = getVoices().find((v) => v.voiceURI === o.voiceURI)

  const step = () => {
    if (stopped) return
    if (i >= segs.length) {
      o.onEnd?.()
      return
    }
    o.onProgress?.(i, segs.length)
    const { text, pause } = segs[i++]
    const after = () => {
      timer = setTimeout(step, pause * 1000)
    }
    if (!text) return after()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = o.rate ?? 0.85
    u.pitch = o.pitch ?? 0.95
    u.volume = o.volume ?? 1
    if (voice) u.voice = voice
    u.onend = after
    u.onerror = after
    speechSynthesis.speak(u)
  }
  if (ttsSupported()) {
    speechSynthesis.cancel()
    step()
  } else o.onEnd?.()

  return {
    stop() {
      stopped = true
      clearTimeout(timer)
      if (ttsSupported()) speechSynthesis.cancel()
    },
  }
}
