import type { Category } from '../types'

/**
 * Process- and growth-oriented affirmations. Avoids implausible claims ("I am a millionaire"),
 * which research suggests can backfire for people with low self-belief.
 */
const BY_CATEGORY: Record<Category, string[]> = {
  love: [
    'I deserve kindness and respect.',
    'I can build meaningful connections, one honest conversation at a time.',
    'I am learning to receive and express love.',
    'My worth is not determined by someone else’s attention.',
  ],
  self_love: [
    'I can speak to myself the way I would speak to a good friend.',
    'I am allowed to take up space.',
    'Mistakes are part of learning, not proof that I’m not enough.',
  ],
  academic: [
    'I understand more each time I practice.',
    'I can ask questions — that is how learning works.',
    'One focused session at a time is enough.',
  ],
  peace: [
    'I can pause and breathe before I respond.',
    'I don’t have to solve everything today.',
    'Calm is a skill I’m practicing.',
  ],
  finance: [
    'I’m learning to make money decisions that my future self will thank me for.',
    'Every time I pause before spending, I practice financial self-control.',
    'I can build security gradually, one choice at a time.',
  ],
  confidence: [
    'I can feel nervous and still speak up.',
    'Each conversation I start is practice, not a test.',
    'My voice is worth hearing, even when it shakes.',
  ],
  productivity: [
    'I can begin with one small, focused step.',
    'I choose my priorities instead of letting distractions choose for me.',
    'Progress counts, even when it’s not perfect.',
  ],
  health: [
    'I’m building a body and routine that support my energy.',
    'Small movements done often add up.',
    'I treat rest as part of progress, not a reward for it.',
  ],
  career: [
    'I’m steadily building skills that create value.',
    'I can learn from setbacks without defining myself by them.',
    'I show up and do the work that moves me forward.',
  ],
  learning: [
    'Struggling with something is how my brain learns it.',
    'I’m becoming someone who practices, not just consumes.',
    'I can understand difficult things with time and repetition.',
  ],
  relationships: [
    'I’m learning to show up with patience and attention.',
    'I can express what I need kindly and clearly.',
    'Small acts of care strengthen my relationships.',
  ],
  creativity: [
    'I give myself permission to make imperfect first drafts.',
    'Creating regularly matters more than waiting for inspiration.',
    'My ideas deserve time and attention.',
  ],
  general: [
    'I’m becoming the person I want to be, one choice at a time.',
    'I can return to my goals after a hard day.',
    'Small actions, repeated, are changing my life.',
  ],
  custom: [],
}

BY_CATEGORY.custom = BY_CATEGORY.general

export function suggestAffirmations(category: Category, opts: { behavior?: string; obstacle?: string } = {}): string[] {
  const out = [...BY_CATEGORY[category]]
  const b = opts.behavior?.trim().toLowerCase()
  const ob = opts.obstacle?.trim().toLowerCase()
  if (b) out.unshift(`Each time I ${b.replace(/^to /, '')}, I build evidence of who I’m becoming.`)
  if (ob) out.push(`When ${ob} shows up, I can respond with one small next step.`)
  return out
}

const OVERCLAIM = /\b(always|never fail|guarantee|effortless(ly)?|perfect(ly)?|millionaire|billionaire|everyone loves|nothing can stop)\b/i

/** Gentle check: flags absolute statements that may feel unbelievable. */
export function credibilityHint(text: string): string | null {
  if (OVERCLAIM.test(text))
    return 'Absolute statements can feel unbelievable. Try a growth framing like “I’m learning to…” or “I can…”.'
  return null
}
