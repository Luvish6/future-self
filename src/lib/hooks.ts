import { useMemo } from 'react'
import { useCollection } from './store'
import type { Profile } from './types'
import { dayKey } from './util'

/** The single profile row (onboarding answers, values). */
export function useProfile() {
  const { rows, save, loading } = useCollection('profiles')
  const profile: Profile | undefined = rows[0]
  return {
    profile,
    loading,
    saveProfile: (p: Partial<Profile>) => save({ ...(profile ? { id: profile.id } : { display_name: '', onboarding: null, core_values: [] }), ...p }),
  }
}

/** Habit logs indexed by habit id → set of done dates; toggle for a date. */
export function useHabitLogs() {
  const { rows, save, remove } = useCollection('habit_logs')
  const byHabit = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const l of rows) {
      if (!m.has(l.habit_id)) m.set(l.habit_id, new Set())
      m.get(l.habit_id)!.add(l.log_date)
    }
    return m
  }, [rows])
  const toggle = async (habit_id: string, date = dayKey()) => {
    const existing = rows.find((l) => l.habit_id === habit_id && l.log_date === date)
    if (existing) await remove(existing.id)
    else await save({ habit_id, log_date: date })
  }
  return { logs: rows, byHabit, toggle, doneOn: (id: string, date = dayKey()) => byHabit.get(id)?.has(date) ?? false }
}
