/** Ordering helpers for vision boards (pure, tested). */
export interface Positioned { id: string; position?: number; created_at: string }

export const byPosition = <T extends Positioned>(xs: T[]) =>
  [...xs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.created_at.localeCompare(b.created_at))

/** Move one item earlier (-1) or later (+1). Returns only rows whose position changed. */
export function move<T extends Positioned>(xs: T[], id: string, dir: -1 | 1): { id: string; position: number }[] {
  const list = byPosition(xs)
  const i = list.findIndex((x) => x.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return []
  ;[list[i], list[j]] = [list[j], list[i]]
  return list.map((x, n) => ({ id: x.id, position: n })).filter((x, n) => (list[n].position ?? -1) !== x.position)
}

export const nextPosition = (xs: Positioned[]) => xs.reduce((m, x) => Math.max(m, x.position ?? 0), -1) + 1

export const SIZES = ['S', 'M', 'L'] as const
export const nextSize = (s?: 'S' | 'M' | 'L') => SIZES[(SIZES.indexOf(s ?? 'S') + 1) % SIZES.length]
