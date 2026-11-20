import type { Category } from '../lib/types'
import { CATEGORY_LABEL, HABIT_LIBRARY } from '../lib/engine/categorize'
import { suggestAffirmations } from '../lib/engine/affirmations'

/**
 * Preset Goal World content. Everything is a starting suggestion: it is copied into the user's
 * own rows on creation, where every item can be edited or removed. See AGENTS.md ethics checklist.
 */
export interface WorldPack {
  category: Category
  blurb: string
  title: string
  identity: string
  milestones: string[]
  reflection: string[]
  viz: { behavior: string; obstacle: string; response: string; place: string }
}

export const PRESETS: WorldPack[] = [
  {
    category: 'love', blurb: 'Feel connected, valued and able to give and receive care.',
    title: 'Feel loved and connected',
    identity: 'I’m becoming someone who builds warm, honest connections and treats myself with care.',
    milestones: ['Reach out to three people this week', 'Have one honest conversation about how I feel', 'Plan regular time with someone I care about', 'Notice moments of connection for a month'],
    reflection: ['Where did I feel connected today?', 'What did I need, and did I ask for it?', 'How did I show care to someone — including myself?'],
    viz: { behavior: 'reach out to someone I care about with a warm message', obstacle: 'a worry that I’m bothering them', response: 'remind myself that connection takes initiative and send it anyway', place: 'a quiet moment at home' },
  },
  {
    category: 'self_love', blurb: 'Build a kinder, steadier relationship with yourself.',
    title: 'Treat myself with kindness',
    identity: 'I’m becoming someone who speaks to myself with respect, even on hard days.',
    milestones: ['Catch and reframe one harsh thought a day for a week', 'Set one boundary that protects my energy', 'Keep a list of ten things I handled well', 'Do one restorative thing each week for a month'],
    reflection: ['What would I say to a friend in my situation?', 'What did I do well today?', 'What do I need more of this week?'],
    viz: { behavior: 'respond to a mistake with a calm, kind inner voice', obstacle: 'the familiar urge to criticize myself', response: 'pause, name the feeling, and say what I’d tell a friend', place: 'my usual morning routine' },
  },
  {
    category: 'confidence', blurb: 'Speak up, take on challenges and trust your voice.',
    title: 'Speak with confidence',
    identity: 'I’m becoming someone who speaks up even when I feel nervous.',
    milestones: ['Ask one question in a group setting', 'Share an opinion in a meeting or class', 'Start a conversation with someone new', 'Take on one challenge I’d normally avoid'],
    reflection: ['What did I do today despite feeling nervous?', 'What strength did I use?', 'What small challenge could I try next?'],
    viz: { behavior: 'share my idea clearly in a meeting', obstacle: 'my heart racing and wanting to stay quiet', response: 'take one slow breath and say my first sentence', place: 'a meeting room or classroom' },
  },
  {
    category: 'finance', blurb: 'Build stability, freedom and options — at a sustainable pace.',
    title: 'Become financially independent',
    identity: 'I’m becoming someone who makes thoughtful money decisions that support my future.',
    milestones: ['Track every expense for two weeks', 'Set up an automatic transfer to savings', 'Build a starter emergency fund', 'Review and cut one recurring cost'],
    reflection: ['Did my spending today match my priorities?', 'What did I learn about money this week?', 'What would give me more financial peace of mind?'],
    viz: { behavior: 'review my week’s spending calmly in my budget', obstacle: 'the temptation of an impulse purchase', response: 'wait 24 hours and check it against my goals', place: 'my desk with a cup of tea' },
  },
  {
    category: 'career', blurb: 'Grow skills, take ownership and build meaningful work.',
    title: 'Grow in my career',
    identity: 'I’m becoming someone who keeps building valuable skills and owns my growth.',
    milestones: ['Define the next role or skill I’m aiming for', 'Complete one skill-building project', 'Ask for feedback from a mentor or manager', 'Share my work or apply for an opportunity'],
    reflection: ['What did I learn at work today?', 'What am I proud of this week?', 'What’s one step toward the work I want?'],
    viz: { behavior: 'work on my most valuable task with full focus', obstacle: 'a message pulling me into busywork', response: 'note it for later and return to the task', place: 'my workspace at the start of the day' },
  },
  {
    category: 'academic', blurb: 'Study effectively and feel prepared, not panicked.',
    title: 'Succeed in my studies',
    identity: 'I’m becoming a student who studies consistently and asks for help early.',
    milestones: ['Create a weekly study schedule', 'Use practice testing for one subject', 'Ask a teacher or classmate one question', 'Prepare for an exam a week early'],
    reflection: ['What did I understand better today?', 'Which study method actually helped?', 'Where do I need help?'],
    viz: { behavior: 'start a focused study session and test myself', obstacle: 'feeling overwhelmed by how much there is', response: 'pick one topic and set a 25-minute timer', place: 'my study desk or the library' },
  },
  {
    category: 'health', blurb: 'More energy through sustainable movement, rest and nourishment.',
    title: 'Feel healthy and energized',
    identity: 'I’m becoming someone who takes care of my body with small, steady habits.',
    milestones: ['Move my body three times this week', 'Keep a consistent bedtime for two weeks', 'Add one nourishing meal to my routine', 'Notice a change in my energy after a month'],
    reflection: ['How is my energy today, and why?', 'What helped my body feel good?', 'What’s one easy improvement for tomorrow?'],
    viz: { behavior: 'put on my shoes and go for a short walk', obstacle: 'feeling tired and wanting to skip', response: 'commit to just five minutes and see how I feel', place: 'my front door in the evening' },
  },
  {
    category: 'peace', blurb: 'Feel calmer, steadier and more in control of your reactions.',
    title: 'Feel more peaceful and balanced',
    identity: 'I’m becoming someone who can pause, breathe and respond instead of react.',
    milestones: ['Practice a two-minute breathing pause daily for a week', 'Identify my top three stressors', 'Create a short wind-down routine', 'Handle one stressful moment calmly and note it'],
    reflection: ['What drained me today, and what restored me?', 'When did I pause before reacting?', 'What can I let go of tonight?'],
    viz: { behavior: 'notice stress rising and take three slow breaths', obstacle: 'a tense message or conversation', response: 'pause before replying and choose my words', place: 'a busy moment in my day' },
  },
  {
    category: 'relationships', blurb: 'Healthier communication, boundaries and closeness.',
    title: 'Build healthier relationships',
    identity: 'I’m becoming someone who communicates honestly and respects both my needs and others’.',
    milestones: ['Practice one “I” statement in a real conversation', 'Set one clear, kind boundary', 'Spend undistracted time with someone important', 'Repair one misunderstanding'],
    reflection: ['Did I say what I meant today?', 'Where did I listen well?', 'Is there a boundary I need to set or respect?'],
    viz: { behavior: 'calmly say what I need in a difficult conversation', obstacle: 'the other person getting defensive', response: 'stay calm, listen, and restate my need kindly', place: 'a conversation at home' },
  },
  {
    category: 'productivity', blurb: 'Focus on what matters and finish what you start.',
    title: 'Be focused and productive',
    identity: 'I’m becoming someone who chooses priorities and protects focused time.',
    milestones: ['Plan my top three priorities daily for a week', 'Complete five distraction-free focus blocks', 'Finish one task I’ve been avoiding', 'Design a weekly review habit'],
    reflection: ['What mattered most today, and did I do it?', 'What distracted me?', 'What will I protect time for tomorrow?'],
    viz: { behavior: 'start my most important task first thing', obstacle: 'the pull to check my phone', response: 'put the phone in another room and begin', place: 'my desk in the morning' },
  },
]

export const CUSTOM: WorldPack = {
  category: 'custom', blurb: 'Define your own goal from scratch.', title: '', identity: 'I’m becoming someone who ',
  milestones: [], reflection: ['What moved me forward today?', 'What got in the way?', 'What will I try next?'],
  viz: { behavior: '', obstacle: '', response: 'pause, breathe, and take the smallest next step', place: '' },
}

export const packFor = (c: Category) => PRESETS.find((p) => p.category === c) ?? CUSTOM

/** An editable draft from a pack; every list item can be toggled off or edited before saving. */
export interface GoalDraft {
  title: string
  category: Category
  description: string
  why: string
  identity_statement: string
  milestones: string[]
  reflection_questions: string[]
  affirmations: string[]
  habits: { title: string; minutes: number }[]
}

export function draftFromPack(p: WorldPack): GoalDraft {
  return {
    title: p.title,
    category: p.category,
    description: p.category === 'custom' ? '' : `${CATEGORY_LABEL[p.category]}: ${p.blurb}`,
    why: '',
    identity_statement: p.identity,
    milestones: [...p.milestones],
    reflection_questions: [...p.reflection],
    affirmations: p.category === 'custom' ? [] : suggestAffirmations(p.category).slice(0, 4),
    habits: p.category === 'custom' ? [] : HABIT_LIBRARY[p.category].slice(0, 4),
  }
}
