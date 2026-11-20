import type { Category, Onboarding } from '../types'
import { categorize, CATEGORY_LABEL, HABIT_LIBRARY } from './categorize'

export interface GrowthPlan {
  category: Category
  focus: string
  identity: string
  why: string
  habits: { title: string; minutes: number; cue: string }[]
  intentions: string[] // implementation intentions: "If/When X, then I will Y"
  woop: { wish: string; outcome: string; obstacle: string; plan: string }
  milestones: string[]
  note: string
}

const firstClause = (s: string, fallback: string) => {
  const c = s.split(/[.\n;!?]/).map((x) => x.trim()).find(Boolean)
  return c ? c.charAt(0).toLowerCase() + c.slice(1) : fallback
}
const items = (s: string) => s.split(/[,\n;]|\band\b/).map((x) => x.trim()).filter((x) => x.length > 2)

const CUES = ['After morning coffee', 'After lunch', 'When I get home', 'Before opening social media', 'After brushing my teeth at night']

export function buildPlan(o: Onboarding): GrowthPlan {
  const category = categorize(`${o.goal} ${o.ideal_life} ${o.behaviors}`)
  const goal = firstClause(o.goal, 'grow toward the life I want')
  const behaviors = items(o.behaviors)
  const obstacles = items(o.obstacles)
  const budget = Math.max(5, o.minutes_per_day || 15)

  // Fill the time budget with user-named behaviors first, then library suggestions.
  const candidates = [
    ...behaviors.map((b) => ({ title: b.charAt(0).toUpperCase() + b.slice(1), minutes: 10 })),
    ...HABIT_LIBRARY[category],
  ]
  const habits: GrowthPlan['habits'] = []
  let used = 0
  for (const c of candidates) {
    if (habits.length >= 3) break
    if (used + c.minutes > budget && habits.length > 0) continue
    habits.push({ ...c, minutes: Math.min(c.minutes, budget), cue: CUES[habits.length % CUES.length] })
    used += Math.min(c.minutes, budget)
  }

  const intentions = (obstacles.length ? obstacles : ['I feel unmotivated']).slice(0, 3).map((ob) => {
    const o2 = ob.toLowerCase().replace(/^i\s+/, 'I ')
    return `If ${o2.startsWith('I ') ? o2 : `I notice "${o2}"`}, then I will do the smallest version of my habit (just 2 minutes).`
  })

  const identityCore = behaviors[0]?.toLowerCase() ?? HABIT_LIBRARY[category][0].title.toLowerCase()
  return {
    category,
    focus: CATEGORY_LABEL[category],
    identity: `I’m becoming someone who makes time to ${identityCore.replace(/^to /, '')} — one small step at a time.`,
    why: o.why.trim() || 'Because this matters to me.',
    habits,
    intentions,
    woop: {
      wish: goal,
      outcome: firstClause(o.ideal_life, 'a life that feels more aligned with my values'),
      obstacle: obstacles[0] ?? firstClause(o.fears, 'losing momentum'),
      plan: intentions[0],
    },
    milestones: [
      'Week 1: practice your first habit on at least 4 days',
      'Week 2: add a second habit and write one weekly review',
      `Week 4: notice evidence of progress: ${firstClause(o.progress_signal, 'one concrete sign you’re moving forward')}`,
      'Month 3: review the plan and adjust what isn’t working',
    ],
    note:
      o.constraints.trim()
        ? `This plan stays within about ${budget} minutes a day and respects your commitments (${firstClause(o.constraints, '')}). Adjust anything that doesn’t fit.`
        : `This plan stays within about ${budget} minutes a day. Adjust anything that doesn’t fit.`,
  }
}
