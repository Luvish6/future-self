import { categorize } from './categorize'
import { buildPlan } from './plan'
import { advise, detectIntent } from './advisor'
import { credibilityHint, suggestAffirmations } from './affirmations'
import { buildVisualization, toSegments, stripPauses } from './visualization'
import { analyzeDay, placeHabits } from './routine'
import { completionRate, flexibleStreak, recoveryMessage } from './streaks'
import { isCrisis } from './safety'
import { addDays, dayKey } from '../util'
import type { Onboarding } from '../types'

const ob: Onboarding = {
  goal: 'Become financially independent', why: 'Freedom for my family', ideal_life: 'No debt, calm about money',
  behaviors: 'track spending, read about investing', obstacles: 'impulse buying, I feel tired after work',
  fears: 'never catching up', habits_to_change: 'late-night shopping', minutes_per_day: 20,
  constraints: 'full-time job', progress_signal: 'an emergency fund',
}

describe('categorize', () => {
  it('detects categories', () => {
    expect(categorize('save money and pay off debt')).toBe('finance')
    expect(categorize('speak confidently in public')).toBe('confidence')
    expect(categorize('xyz')).toBe('general')
  })
})

describe('buildPlan', () => {
  const p = buildPlan(ob)
  it('personalizes from answers within time budget', () => {
    expect(p.category).toBe('finance')
    expect(p.habits[0].title).toBe('Track spending')
    expect(p.habits.reduce((n, h) => n + h.minutes, 0)).toBeLessThanOrEqual(20)
    expect(p.intentions[0]).toMatch(/^If .*then I will/)
    expect(p.woop.obstacle).toBe('impulse buying')
    expect(p.note).toContain('full-time job')
  })
  it('handles empty answers', () => {
    const e = buildPlan({ ...ob, goal: '', behaviors: '', obstacles: '', fears: '', ideal_life: '', why: '', constraints: '', progress_signal: '', minutes_per_day: 0 })
    expect(e.habits.length).toBeGreaterThan(0)
    expect(e.intentions.length).toBe(1)
  })
})

describe('advisor', () => {
  const ctx = { goals: [{ title: 'Financial independence', category: 'finance' as const, why: 'Freedom', identity_statement: 'I am a careful spender' }], values: ['security'], obstacles: 'impulse buying' }
  it('detects intents', () => {
    expect(detectIntent('Should I buy an expensive watch?')).toBe('purchase')
    expect(detectIntent('I keep putting off studying')).toBe('procrastination')
    expect(detectIntent('What should I do with my life')).toBe('decision')
  })
  it('personalizes and stays non-directive', () => {
    const r = advise('I want to buy something expensive', ctx)
    expect(r.framework).toMatch(/spending/i)
    expect(r.summary).toContain('Financial independence')
    expect(r.questions[0]).toContain('careful spender')
    expect(r.disclaimer).toMatch(/not financial/)
  })
  it('routes crisis language to support', () => {
    const r = advise('I want to end it all', ctx)
    expect(r.crisis).toBe(true)
    expect(r.options).toHaveLength(0)
    expect(isCrisis('I feel great')).toBe(false)
  })
})

describe('affirmations', () => {
  it('suggests personalized, credible statements', () => {
    const s = suggestAffirmations('finance', { behavior: 'track spending' })
    expect(s[0]).toContain('track spending')
    expect(s.every((x) => !credibilityHint(x))).toBe(true)
    expect(credibilityHint('I am a millionaire and never fail')).not.toBeNull()
  })
})

describe('visualization', () => {
  it('scales with duration and parses pauses', () => {
    const short = buildVisualization({ goal: 'g', identity: '', behavior: 'write', obstacle: 'doubt', response: 'breathe', place: 'desk', duration_min: 3 })
    const long = buildVisualization({ goal: 'g', identity: '', behavior: 'write', obstacle: 'doubt', response: 'breathe', place: 'desk', duration_min: 10 })
    expect(long.length).toBeGreaterThan(short.length)
    expect(short).toContain('doubt')
    const segs = toSegments(long)
    expect(segs.length).toBeGreaterThan(5)
    expect(segs.reduce((n, s) => n + s.pause, 0)).toBeGreaterThan(60)
    expect(stripPauses(long)).not.toMatch(/\[pause/)
  })
})

describe('routine', () => {
  it('finds gaps, warns on short sleep, never overbooks', () => {
    const a = analyzeDay([
      { start: '23:00', end: '06:00', kind: 'sleep', label: 'Sleep' },
      { start: '09:00', end: '17:00', kind: 'work', label: 'Work' },
    ])
    expect(a.sleepMinutes).toBe(420)
    expect(a.warnings).toHaveLength(0)
    expect(a.gaps.map((g) => g.minutes)).toEqual([180, 360])
    const s = placeHabits(a.gaps, [{ title: 'Walk', minutes: 20 }, { title: 'Read', minutes: 400 }])
    expect(s).toEqual([{ habit: 'Walk', at: '06:05', minutes: 20 }])
    expect(analyzeDay([{ start: '01:00', end: '06:00', kind: 'sleep', label: '' }]).warnings[0]).toMatch(/sleep/)
  })
})

describe('streaks', () => {
  const today = new Date(2026, 10, 20)
  const set = (...offsets: number[]) => new Set(offsets.map((o) => dayKey(addDays(today, -o))))
  it('forgives one miss but not two', () => {
    expect(flexibleStreak(set(0, 1, 2), [], today).streak).toBe(3)
    expect(flexibleStreak(set(0, 2, 3), [], today)).toEqual({ streak: 3, graceUsed: true })
    expect(flexibleStreak(set(0, 3, 4), [], today).streak).toBe(1)
    expect(flexibleStreak(set(1, 2), [], today).streak).toBe(2) // today pending
  })
  it('respects scheduled weekdays and rates', () => {
    const fri = today.getDay()
    expect(flexibleStreak(set(0, 7), [fri], today).streak).toBe(2)
    expect(completionRate(set(0, 1, 2, 3, 4, 5, 6), [], 7, today)).toBe(1)
    expect(recoveryMessage(set(), [], today)).toMatch(/missed yesterday/)
    expect(recoveryMessage(set(1), [], today)).toBeNull()
  })
  it('ignores days before the habit existed', () => {
    const since = dayKey(today)
    expect(flexibleStreak(set(0), [], today, since)).toEqual({ streak: 1, graceUsed: false })
    expect(completionRate(set(0), [], 30, today, since)).toBe(1)
    expect(recoveryMessage(set(), [], today, since)).toBeNull()
    expect(flexibleStreak(set(0, 3, 4), [], today).graceUsed).toBe(false)
  })
})
