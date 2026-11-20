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

// ---- weekly targets ("3 times a week", any days) ----
/** Monday-based start of the week containing d (local time). */
export function weekStart(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

/** Completions in the week `weeksAgo` weeks before the current one. */
export function weekCount(done: Set<string>, today = new Date(), weeksAgo = 0) {
  const s = addDays(weekStart(today), -7 * weeksAgo)
  let n = 0
  for (let i = 0; i < 7; i++) if (done.has(dayKey(addDays(s, i)))) n++
  return n
}

/** Consecutive weeks meeting the target. The current week only adds (never breaks) the streak. */
export function weeklyStreak(done: Set<string>, target: number, today = new Date(), since?: string, maxWeeks = 104) {
  let streak = weekCount(done, today, 0) >= target ? 1 : 0
  for (let w = 1; w < maxWeeks; w++) {
    if (since && dayKey(addDays(weekStart(today), -7 * w + 6)) < since) break
    if (weekCount(done, today, w) >= target) streak++
    else break
  }
  return streak
}

/** Average share of the weekly target met over the last `weeks` weeks (incl. current), 0..1. */
export function weeklyRate(done: Set<string>, target: number, today = new Date(), weeks = 4, since?: string) {
  let sum = 0, n = 0
  for (let w = 0; w < weeks; w++) {
    if (w > 0 && since && dayKey(addDays(weekStart(today), -7 * w + 6)) < since) break
    sum += Math.min(1, weekCount(done, today, w) / target)
    n++
  }
  return n ? sum / n : 0
}
