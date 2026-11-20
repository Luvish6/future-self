import { categorize } from './categorize'
import { buildPlan } from './plan'
import { advise, detectIntent } from './advisor'
import { credibilityHint, suggestAffirmations } from './affirmations'
import { buildVisualization, toSegments, stripPauses } from './visualization'
import { analyzeDay, placeHabits } from './routine'
import { completionRate, flexibleStreak, recoveryMessage, weekCount, weekStart, weeklyRate, weeklyStreak } from './streaks'
import { isCrisis } from './safety'
import { obstaclesFor, responseFor, suggestedWords, summarize, toVizInput } from './simulator'
import { FOLLOW_UPS, followUp, futureLens } from './guidance'
import { challengesFor, pickDaily, reflectionQuestions } from './daily'
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

describe('weekly targets', () => {
  // 2026-11-20 is a Friday; its week starts Monday 2026-11-16.
  const fri = new Date(2026, 10, 20)
  const days = (...ds: string[]) => new Set(ds)
  it('counts by Monday-based week', () => {
    expect(dayKey(weekStart(fri))).toBe('2026-11-16')
    expect(weekCount(days('2026-11-16', '2026-11-20', '2026-11-15'), fri)).toBe(2)
    expect(weekCount(days('2026-11-15'), fri, 1)).toBe(1)
  })
  it('streak counts met weeks; an unfinished current week never breaks it', () => {
    const prev2 = ['2026-11-02', '2026-11-04', '2026-11-06'], prev1 = ['2026-11-09', '2026-11-10', '2026-11-12']
    expect(weeklyStreak(days(...prev2, ...prev1), 3, fri)).toBe(2)
    expect(weeklyStreak(days(...prev2, ...prev1, '2026-11-16', '2026-11-17', '2026-11-18'), 3, fri)).toBe(3)
    expect(weeklyStreak(days(...prev2), 3, fri)).toBe(0)
  })
  it('rate averages target share and respects creation date', () => {
    expect(weeklyRate(days('2026-11-16', '2026-11-17', '2026-11-18'), 3, fri, 4, '2026-11-16')).toBe(1)
    expect(weeklyRate(days('2026-11-16'), 2, fri, 1)).toBe(0.5)
  })
})

describe('daily goal experience', () => {
  it('picks the same item all day per goal and cycles with offset', () => {
    const xs = ['a', 'b', 'c']
    const first = pickDaily(xs, 'g1', '2026-11-20')
    expect(pickDaily(xs, 'g1', '2026-11-20')).toBe(first)
    const seen = new Set([0, 1, 2].map((o) => pickDaily(xs, 'g1', '2026-11-20', o)))
    expect(seen.size).toBe(3)
    expect(pickDaily([], 'g1', '2026-11-20')).toBeNull()
  })
  it('challenges exclude existing habits and always offer something', () => {
    const c = challengesFor('love', ['Express appreciation to someone'])
    expect(c).not.toContain('Express appreciation to someone')
    expect(challengesFor('custom', []).length).toBeGreaterThan(0)
    expect(reflectionQuestions([])).toHaveLength(3)
    expect(reflectionQuestions(['Q'])).toEqual(['Q'])
  })
})

describe('situation-based advisor', () => {
  const ctx = { goals: [{ title: 'Feel loved and secure', category: 'love' as const, why: '', identity_statement: 'I’m becoming someone who feels secure and valued — one step at a time.' }], values: [], obstacles: '' }
  it('detects the spec scenarios', () => {
    expect(detectIntent('I feel ignored by someone important to me')).toBe('ignored')
    expect(detectIntent("I'm afraid to speak in a meeting")).toBe('fear')
    expect(detectIntent("I'm tempted to spend money impulsively")).toBe('purchase')
    expect(detectIntent("I'm struggling to set boundaries")).toBe('boundary')
    expect(detectIntent('I received a rejection and feel discouraged')).toBe('rejection')
  })
  it('gives full, goal-anchored, non-predictive guidance', () => {
    const r = advise('I feel ignored by someone important to me. How would my future self respond?', ctx)
    const g = r.guidance!
    expect(g.interpret.startsWith('A version of you who feels secure and valued')).toBe(true)
    expect(g.interpret).toMatch(/might/)
    for (const k of ['regulate', 'healthy', 'boundaries', 'action'] as const) expect(g[k].length).toBeGreaterThan(20)
    expect(g.say.length).toBeGreaterThan(0)
    expect(g.avoid.length).toBeGreaterThan(0)
    expect(r.nextStep).toBe(g.action)
    expect(JSON.stringify(r)).not.toMatch(/\b(will definitely|guarantee|your future self will)\b/i)
  })
  it('answers every follow-up for every intent', () => {
    for (const i of ['ignored', 'boundary', 'rejection', 'purchase', 'fear', 'decision'] as const)
      for (const f of FOLLOW_UPS) expect(followUp(i, f.id).lines.length).toBeGreaterThan(0)
    expect(futureLens('')).toBe('The person you’re becoming')
    expect(futureLens('I’m becoming someone who treats myself with care and trusts my voice.')).toBe('A version of you who treats yourself with care and trusts your voice')
  })
})

describe('future self simulator', () => {
  const sim = {
    situation: 'I have a presentation tomorrow and I feel nervous', when: 'tomorrow 10am', place: 'the meeting room', people: 'my team',
    showUpAs: 'calm and clear', obstacles: ['My mind goes blank', 'Someone disagrees or challenges me'], responses: { 'My mind goes blank': '' },
    words: '“Here’s what I found.”', action: 'Rehearse the opening out loud twice', actionWhen: 'tonight',
  }
  it('suggests situation-specific obstacles and responses', () => {
    expect(obstaclesFor(sim.situation)).toContain('My mind goes blank')
    expect(responseFor('My voice shakes')).toMatch(/breathe/)
    expect(responseFor('something unusual')).toMatch(/small step/)
    expect(suggestedWords('I want to set a boundary')).toMatch(/“/)
  })
  it('summarizes with if-then plans and a real action, and feeds a rehearsal script', () => {
    const s = summarize(sim)
    expect(s).toMatch(/If my mind goes blank, then I will pause/)
    expect(s).toMatch(/My real-world action: Rehearse the opening out loud twice — tonight/)
    const v = toVizInput(sim, 'Speak with confidence', '')
    expect(v.obstacle).toBe('my mind goes blank')
    expect(v.place).toBe('the meeting room with my team')
    expect(buildVisualization(v)).toContain('my mind goes blank')
  })
})
