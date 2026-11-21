import type { Category } from '../types'
import { HABIT_LIBRARY } from './categorize'
import { hash } from '../util'

/** Deterministic daily pick: same item all day for a goal; `offset` lets the user ask for another. */
export function pickDaily<T>(items: T[], goalId: string, date: string, offset = 0): T | null {
  if (!items.length) return null
  return items[(((hash(`${goalId}:${date}`) % items.length) + items.length + offset) % items.length)]
}

/** Small, optional real-world challenges. Framed as invitations; skipping is always fine. */
const GENERIC = [
  'Do the two-minute version of one habit',
  'Notice one moment today that fits who you’re becoming',
  'Tell someone about a small step you took',
  'Remove one obstacle that makes your habit harder',
  'For the next hour, make one choice the way the person you’re becoming would',
  'Do one small thing your future self does — then log it as evidence',
]

export function challengesFor(category: Category, existingHabits: string[]) {
  const lib = HABIT_LIBRARY[category].map((h) => h.title).filter((t) => !existingHabits.includes(t))
  return [...lib, ...GENERIC]
}

const DEFAULT_QUESTIONS = ['What moved me forward today?', 'What got in the way, and what will I try next?', 'What am I grateful for today?']
export const reflectionQuestions = (q?: string[]) => (q && q.length ? q : DEFAULT_QUESTIONS)
