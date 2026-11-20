import { addDays, dayKey } from '../util'

/** Is the habit scheduled on this date? days = [] means every day. */
export const isScheduled = (days: number[], d: Date) => days.length === 0 || days.includes(d.getDay())

/**
 * Flexible streak: counts scheduled days completed, walking back from today.
 * One missed scheduled day is forgiven ("never miss twice"); two consecutive misses end it.
 * Today not yet done doesn't break the streak. Days before `since` (habit creation) are ignored.
 */
export function flexibleStreak(done: Set<string>, days: number[], today = new Date(), since?: string, maxLookback = 400) {
  let streak = 0
  let misses = 0
  let graceUsed = false
  for (let i = 0; i < maxLookback; i++) {
    const d = addDays(today, -i)
    const k = dayKey(d)
    if (since && k < since) break
    if (!isScheduled(days, d)) continue
    if (done.has(k)) {
      if (misses) graceUsed = true
      streak++
      misses = 0
    } else if (i > 0 && ++misses >= 2) break
  }
  return { streak, graceUsed }
}

/** Completion rate over the last n days (scheduled days since creation only), 0..1. */
export function completionRate(done: Set<string>, days: number[], n: number, today = new Date(), since?: string) {
  let sched = 0, hit = 0
  for (let i = 0; i < n; i++) {
    const d = addDays(today, -i)
    const k = dayKey(d)
    if (since && k < since) break
    if (!isScheduled(days, d)) continue
    sched++
    if (done.has(k)) hit++
  }
  return sched ? hit / sched : 0
}

export function recoveryMessage(done: Set<string>, days: number[], today = new Date(), since?: string): string | null {
  const y = addDays(today, -1)
  const k = dayKey(y)
  if ((since && k < since) || !isScheduled(days, y) || done.has(k) || done.has(dayKey(today))) return null
  return 'You missed yesterday — that’s normal. Doing even a tiny version today keeps the habit alive.'
}
