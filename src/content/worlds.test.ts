import { CUSTOM, PRESETS, draftFromPack, packFor } from './worlds'
import { credibilityHint } from '../lib/engine/affirmations'

// Ethics checklist (AGENTS.md): no manifestation/attraction claims, guarantees, brain-rewiring or promises about others.
const FORBIDDEN = /\b(manifest\w*|law of attraction|attract(s|ing)? (wealth|love|money)|universe will|guarantee\w*|rewir\w*|subconscious|millionaire|they will love you|make (him|her|them) (love|want))\b/i

describe('goal world packs', () => {
  it('covers the required preset categories once each', () => {
    const cats = PRESETS.map((p) => p.category)
    expect(new Set(cats).size).toBe(cats.length)
    for (const c of ['love', 'self_love', 'confidence', 'finance', 'career', 'academic', 'health', 'peace', 'relationships', 'productivity'])
      expect(cats).toContain(c)
  })

  it.each(PRESETS.map((p) => [p.category, p] as const))('%s pack is complete and passes the ethics check', (_c, p) => {
    const d = draftFromPack(p)
    expect(d.title).toBeTruthy()
    expect(d.milestones.length).toBeGreaterThanOrEqual(3)
    expect(d.reflection_questions.length).toBeGreaterThanOrEqual(3)
    expect(d.affirmations.length).toBeGreaterThanOrEqual(3)
    expect(d.habits.length).toBeGreaterThanOrEqual(4)
    expect(d.affirmations.every((a) => !credibilityHint(a))).toBe(true)
    expect(JSON.stringify(d) + JSON.stringify(p.viz)).not.toMatch(FORBIDDEN)
  })

  it('custom starts empty but guided', () => {
    const d = draftFromPack(CUSTOM)
    expect(d.title).toBe('')
    expect(d.habits).toHaveLength(0)
    expect(d.reflection_questions.length).toBeGreaterThan(0)
    expect(packFor('general')).toBe(CUSTOM)
  })

  it('drafts are copies (editing never mutates presets)', () => {
    const d = draftFromPack(PRESETS[0])
    d.milestones.pop()
    expect(PRESETS[0].milestones.length).toBe(draftFromPack(PRESETS[0]).milestones.length)
  })
})
