import type { BlockKind } from '../types'
import { fmtTime, toMinutes } from '../util'

export interface Block { start: string; end: string; kind: BlockKind; label: string }
export interface Gap { start: number; end: number; minutes: number }
export interface Suggestion { habit: string; at: string; minutes: number }

const DAY = 24 * 60
const WAKE = 6 * 60, BED = 23 * 60

/** Normalise blocks into [start,end) minute ranges; overnight blocks are split. */
function ranges(blocks: Block[]) {
  const out: { s: number; e: number; kind: BlockKind }[] = []
  for (const b of blocks) {
    const s = toMinutes(b.start), e = toMinutes(b.end)
    if (Number.isNaN(s) || Number.isNaN(e) || s === e) continue
    if (e > s) out.push({ s, e, kind: b.kind })
    else out.push({ s, e: DAY, kind: b.kind }, { s: 0, e, kind: b.kind })
  }
  return out.sort((a, b) => a.s - b.s)
}

export function analyzeDay(blocks: Block[]) {
  const r = ranges(blocks)
  const busy = r.filter((x) => x.kind !== 'free')
  const sleep = r.filter((x) => x.kind === 'sleep').reduce((n, x) => n + x.e - x.s, 0)
  const scheduled = busy.reduce((n, x) => n + x.e - x.s, 0)

  // Free gaps inside waking window when no sleep block given.
  const merged: { s: number; e: number }[] = []
  for (const x of busy) {
    const last = merged[merged.length - 1]
    if (last && x.s <= last.e) last.e = Math.max(last.e, x.e)
    else merged.push({ s: x.s, e: x.e })
  }
  const lo = sleep ? 0 : WAKE, hi = sleep ? DAY : BED
  const gaps: Gap[] = []
  let cur = lo
  for (const m of merged) {
    if (m.s > cur) gaps.push({ start: cur, end: Math.min(m.s, hi), minutes: Math.min(m.s, hi) - cur })
    cur = Math.max(cur, m.e)
  }
  if (hi > cur) gaps.push({ start: cur, end: hi, minutes: hi - cur })
  const usable = gaps.filter((g) => g.minutes >= 10)

  const warnings: string[] = []
  if (sleep && sleep < 7 * 60) warnings.push(`You’ve scheduled ${Math.round(sleep / 6) / 10}h of sleep. Most adults need 7–9h; more habits won’t help if rest suffers.`)
  if (!sleep) warnings.push('Add a sleep block so suggestions respect your rest.')
  if (usable.reduce((n, g) => n + g.minutes, 0) < 30) warnings.push('Your day is very full. Start with one 2–5 minute habit, or attach habits to existing routines.')

  return { sleepMinutes: sleep, scheduledMinutes: scheduled, gaps: usable, freeMinutes: usable.reduce((n, g) => n + g.minutes, 0), warnings }
}

/** Place habits into free gaps (largest-first fit, buffer of 5 min). Never overbooks. */
export function placeHabits(gaps: Gap[], habits: { title: string; minutes: number }[]): Suggestion[] {
  const pool = gaps.map((g) => ({ ...g }))
  const out: Suggestion[] = []
  for (const h of [...habits].sort((a, b) => b.minutes - a.minutes)) {
    const g = pool.filter((x) => x.end - x.start >= h.minutes + 5).sort((a, b) => a.start - b.start)[0]
    if (!g) continue
    out.push({ habit: h.title, at: fmtTime(g.start + 5), minutes: h.minutes })
    g.start += h.minutes + 5
  }
  return out.sort((a, b) => a.at.localeCompare(b.at))
}
