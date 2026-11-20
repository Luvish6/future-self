import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCollection } from '../lib/store'
import { themeOf } from '../lib/worlds'
import type { Goal } from '../lib/types'
import { ThemeDot } from './ThemePicker'
import { Chip } from './ui'

/** Scope the page background and tokens to a goal's theme while mounted. */
export function useWorldTheme(goal?: Pick<Goal, 'theme' | 'category'> | null) {
  const theme = goal ? themeOf(goal) : undefined
  useEffect(() => {
    const el = document.documentElement
    if (theme && theme !== 'neutral') el.dataset.world = theme
    else delete el.dataset.world
    return () => { delete el.dataset.world }
  }, [theme])
}

/** `?goal=<id>` scope for feature pages; absent = all goals. Applies the goal's theme. */
export function useGoalScope() {
  const [params, setParams] = useSearchParams()
  const goals = useCollection('goals').rows.filter((g) => g.status !== 'done')
  const goal = goals.find((g) => g.id === params.get('goal')) ?? null
  useWorldTheme(goal)
  const set = (id: string | null) => {
    const p = new URLSearchParams(params)
    if (id) p.set('goal', id)
    else p.delete('goal')
    setParams(p, { replace: true })
  }
  return { goal, goals, set }
}

export function GoalScopeBar({ scope }: { scope: ReturnType<typeof useGoalScope> }) {
  if (scope.goals.length < 1) return null
  return (
    <div role="group" aria-label="Show items for" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      <Chip active={!scope.goal} onClick={() => scope.set(null)}>All goals</Chip>
      {scope.goals.map((g) => (
        <Chip key={g.id} active={scope.goal?.id === g.id} onClick={() => scope.set(g.id)}>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><ThemeDot theme={themeOf(g)} />{g.title}</span>
        </Chip>
      ))}
    </div>
  )
}
