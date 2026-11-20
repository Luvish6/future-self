export interface VizInput {
  goal: string
  identity: string
  behavior: string
  obstacle: string
  response: string
  place: string
  duration_min: number
}

/** Pause marker understood by the player: [pause 5] = 5 seconds. */
export const PAUSE_RE = /\[pause (\d+)\]/g

/**
 * Process-focused mental rehearsal (not outcome-only fantasy): settle, rehearse the actual
 * behavior in a concrete place, meet a realistic obstacle, rehearse the response, commit to a step.
 */
export function buildVisualization(i: VizInput): string {
  const d = Math.max(3, Math.min(20, i.duration_min))
  const p = (base: number) => `[pause ${Math.round(base * (d / 5))}]`
  const goal = i.goal || 'your goal'
  const beh = i.behavior || 'take one meaningful step toward your goal'
  const place = i.place || 'a place where you usually spend your day'
  const ob = i.obstacle || 'a moment where you feel like giving up'
  const resp = i.response || 'pause, take a breath, and do the smallest version of the task'

  const parts: string[] = [
    `Find a comfortable position. Let your eyes close or rest your gaze softly. ${p(3)}`,
    `Breathe in slowly through your nose… and out through your mouth. ${p(4)} Again — in… and out. ${p(4)}`,
    `This is a rehearsal. You’re not predicting the future; you’re practicing how you want to act.`,
    `Picture yourself in ${place}. Notice what you can see, the light, the sounds around you, the temperature of the air. ${p(6)}`,
    `You’re working toward ${goal}. ${i.identity ? `Remember: ${i.identity}` : ''} ${p(3)}`,
    `Now see yourself beginning to ${beh}. Notice your posture, your hands, the first small action. ${p(8)}`,
  ]
  if (d >= 5)
    parts.push(
      `Stay with it. Notice what it feels like to be focused and engaged — not perfect, just present. ${p(8)}`,
    )
  parts.push(
    `Now imagine a realistic challenge: ${ob}. Let yourself feel it for a moment. ${p(5)}`,
    `Watch yourself respond: you ${resp}. See it happening, step by step. ${p(8)}`,
    `Notice the quiet satisfaction of handling it — of keeping a promise to yourself. ${p(5)}`,
  )
  if (d >= 10)
    parts.push(
      `Run through it once more, a little faster: the place, the start, the obstacle, your response. ${p(12)}`,
      `Think of one person who benefits when you follow through. Picture their reaction. ${p(8)}`,
    )
  parts.push(
    `Before you finish, choose one specific step for today — when and where you will do it. ${p(6)}`,
    `Take a deep breath in… and out. When you’re ready, gently open your eyes.`,
  )
  return parts.map((s) => s.replace(/\s+/g, ' ').trim()).join('\n\n')
}

/** Split a script into speakable chunks with pauses (seconds). */
export function toSegments(script: string): { text: string; pause: number }[] {
  const segs: { text: string; pause: number }[] = []
  let last = 0
  for (const m of script.matchAll(PAUSE_RE)) {
    const text = script.slice(last, m.index).trim()
    segs.push({ text, pause: Number(m[1]) })
    last = (m.index ?? 0) + m[0].length
  }
  const tail = script.slice(last).trim()
  if (tail) segs.push({ text: tail, pause: 1 })
  return segs.filter((s) => s.text || s.pause)
}

export const stripPauses = (s: string) => s.replace(PAUSE_RE, '').replace(/ {2,}/g, ' ')
