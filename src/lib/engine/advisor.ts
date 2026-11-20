import { guidanceFor, type Guidance, type Intent } from './guidance'
export type { Intent }
import type { Category } from '../types'
import { categorize, CATEGORY_LABEL } from './categorize'
import { CRISIS_MESSAGE, DISCLAIMER, isCrisis } from './safety'

export interface AdvisorContext {
  goals: { title: string; category: Category; why: string; identity_statement: string }[]
  values: string[]
  obstacles: string
}

export interface AdvisorReply {
  intent: Intent
  framework: string
  summary: string
  questions: string[]
  options: string[]
  nextStep: string
  disclaimer: string
  crisis?: boolean
  guidance: Guidance | null
}


const INTENTS: [Intent, RegExp][] = [
  ['ignored', /\b(ignor\w*|left on read|no reply|(didn'?t|doesn'?t|won'?t) (text|reply|call|answer)( me)?( back)?|feel (unloved|unwanted|invisible|left out)|not a priority)\b/i],
  ['boundary', /\b(boundar\w*|say no|saying no|people[- ]pleas\w*|taken advantage|overstep\w*|can'?t say no)\b/i],
  ['rejection', /\b(rejected|rejection|turned down|didn'?t get (the|a) (job|role|place|offer)|declined my)\b/i],
  ['purchase', /\b(buy|purchase|spend|afford|expensive|price|cost|splurge|order|upgrade|subscription|loan|credit card)\b/i],
  ['procrastination', /\b(procrastinat\w*|motivat\w*|lazy|can'?t start|putting off|avoid(ing)?|don'?t feel like|skip(ping)?)\b/i],
  ['setback', /\b(failed|failure|messed up|relapse|missed|broke my streak|gave up|setback|mistake)\b/i],
  ['conflict', /\b(argue|argument|fight|conflict|confront|boundar\w*|angry|upset with|disagree|say no)\b/i],
  ['fear', /\b(scared|afraid|fear|nervous|anxious|worried|imposter|not good enough|confidence)\b/i],
  ['opportunity', /\b(job offer|offer|opportunit\w*|quit|switch|move to|start a business|accept|invitation)\b/i],
  ['health', /\b(eat|food|drink|alcohol|sleep|tired|workout|exercise|gym|junk|late night)\b/i],
  ['priority', /\b(time|busy|priorit\w*|schedule|should i go( out)?|weekend|tonight|overwhelm\w*)\b/i],
]

export function detectIntent(q: string): Intent {
  return INTENTS.find(([, re]) => re.test(q))?.[0] ?? 'decision'
}

const FRAMEWORKS: Record<Intent, { name: string; questions: string[]; options: string[] }> = {
  ignored: {
    name: 'Secure-connection lens',
    questions: ['What do you know for sure, and what are you guessing?', 'What do you need from this relationship?', 'How would you want to feel about your response tomorrow?'],
    options: ['Send one calm, honest message.', 'Give it a little time before reading too much into it.', 'Reach out to someone else who makes you feel valued.'],
  },
  boundary: {
    name: 'Kind, clear boundaries',
    questions: ['What exactly are you saying no (or yes) to?', 'What happens to your energy if nothing changes?', 'What would you do if the boundary isn’t respected?'],
    options: ['Say it simply without over-explaining.', 'Offer an alternative you genuinely want to give.', 'Practise the sentence out loud first.'],
  },
  rejection: {
    name: 'Learn and continue',
    questions: ['What is one thing you can learn from this?', 'What went well that you can keep doing?', 'What’s the next opportunity you can pursue?'],
    options: ['Ask for feedback.', 'Note one improvement and apply it next time.', 'Keep your pipeline moving this week.'],
  },
  purchase: {
    name: 'Values-based spending check',
    questions: [
      'Can you pay for this in full without touching savings or essential bills?',
      'Will you likely still value this in three months?',
      'What else could this money do for your goals?',
      'Are you buying it to solve a feeling (stress, boredom, comparison)?',
    ],
    options: [
      'Wait 24–72 hours and decide again with a clear head.',
      'Look for a cheaper, used, borrowed, or rented alternative.',
      'Set aside the amount gradually and buy it when it fits your plan.',
      'Buy it — if it fits your budget and aligns with your values, enjoying it is fine.',
    ],
  },
  priority: {
    name: '10-10-10 + priorities',
    questions: [
      'How will you feel about this choice in 10 minutes, 10 months, and 10 years?',
      'Which option moves your most important goal forward?',
      'What would you be saying no to by saying yes?',
    ],
    options: [
      'Protect one focused block for your priority, then do the rest guilt-free.',
      'Do a smaller version of both.',
      'Rest on purpose if you’re depleted — recovery supports consistency.',
    ],
  },
  procrastination: {
    name: 'Two-minute start + implementation intention',
    questions: [
      'What is the smallest possible version of this task?',
      'Is the task unclear, too big, or emotionally uncomfortable?',
      'What specific time and place could you start?',
    ],
    options: [
      'Commit to just two minutes; stopping afterwards is allowed.',
      'Break it into a first step you could do in under 10 minutes.',
      'Remove one distraction (phone in another room) before starting.',
      'Write an if-then plan: “When ___, I will ___.”',
    ],
  },
  conflict: {
    name: 'Prepare-the-conversation',
    questions: [
      'What outcome do you actually want from this conversation?',
      'What facts can you describe without blame?',
      'What might the other person need or be worried about?',
    ],
    options: [
      'Use “I” statements: “When ___ happened, I felt ___, and I’d like ___.”',
      'Rehearse the opening sentence out loud.',
      'Choose a calm moment rather than reacting in the heat of the moment.',
      'If safety is a concern, involve a trusted person or professional.',
    ],
  },
  fear: {
    name: 'Mental contrasting (WOOP)',
    questions: [
      'What is the realistic worst case, and how would you cope with it?',
      'What evidence do you have that you can handle hard things?',
      'What would you advise a friend in your situation?',
    ],
    options: [
      'Take a small exposure step — a lower-stakes version of the scary thing.',
      'Prepare thoroughly for the part you can control.',
      'Name the fear in writing, then write one constructive response.',
    ],
  },
  opportunity: {
    name: 'Decision matrix',
    questions: [
      'Which option aligns better with your long-term goals and values?',
      'What is reversible here, and what isn’t?',
      'What information are you missing, and who could you ask?',
    ],
    options: [
      'List pros and cons, then weight each by how much it matters to you.',
      'Talk to someone who has made a similar choice.',
      'Set a decision deadline so it doesn’t drain you.',
    ],
  },
  health: {
    name: 'Energy-first choice',
    questions: [
      'How will this choice affect your energy tomorrow?',
      'Is there a version that meets the need you’re feeling right now?',
      'What would make the healthier option easier?',
    ],
    options: [
      'Choose the “good enough” option instead of all-or-nothing.',
      'Prepare the easier choice in advance (water, snack, gear).',
      'Prioritize sleep tonight — it affects willpower and mood.',
    ],
  },
  setback: {
    name: 'Self-compassionate review',
    questions: [
      'What got in the way — time, energy, environment, or emotion?',
      'What is one thing you’d do differently next time?',
      'What did you still do well?',
    ],
    options: [
      'Restart today with the smallest version of your habit.',
      'Adjust the plan: make it easier or move it to a better time.',
      'Remember: one missed day rarely matters; try not to miss twice.',
    ],
  },
  decision: {
    name: 'Future-self perspective',
    questions: [
      'Which choice is most consistent with who you’re trying to become?',
      'What would you choose if you weren’t afraid of judgment?',
      'What is the cost of not deciding?',
    ],
    options: [
      'Write the options down and note how each supports your goals.',
      'Choose the option that keeps more doors open if you’re unsure.',
      'Sleep on it and revisit tomorrow.',
    ],
  },
}

export function advise(question: string, ctx: AdvisorContext): AdvisorReply {
  const q = question.trim()
  if (isCrisis(q)) {
    return {
      intent: 'decision', framework: 'Support', summary: CRISIS_MESSAGE,
      questions: [], options: [], nextStep: 'Reach out to someone you trust or a helpline now.',
      disclaimer: DISCLAIMER, crisis: true, guidance: null,
    }
  }
  const intent = detectIntent(q)
  const f = FRAMEWORKS[intent]
  const qCat = categorize(q)
  const goal = ctx.goals.find((g) => g.category === qCat) ?? ctx.goals[0]

  const anchor = goal
    ? `Your goal “${goal.title}” (${CATEGORY_LABEL[goal.category].toLowerCase()})${goal.why ? `, which matters because ${goal.why.replace(/\.$/, '').toLowerCase()}` : ''}`
    : 'Your goals'
  const valuesLine = ctx.values.length ? ` You said you value ${ctx.values.slice(0, 3).join(', ')}.` : ''

  const summary =
    `Let’s look at this through the lens of who you’re becoming. ${anchor} is a useful reference point.${valuesLine} ` +
    `There’s no single right answer — the goal is a choice you can stand behind.`

  const questions = [...f.questions]
  if (goal?.identity_statement) questions.unshift(`Does this fit “${goal.identity_statement}”?`)

  const options = [...f.options]
  if (ctx.obstacles && (intent === 'procrastination' || intent === 'setback'))
    options.push(`You mentioned “${ctx.obstacles.split(/[,.\n]/)[0].trim()}” as an obstacle — plan around it explicitly.`)

  return {
    intent,
    framework: f.name,
    summary,
    questions: questions.slice(0, 4),
    options: options.slice(0, 5),
    nextStep: guidanceFor(intent).action,
    guidance: guidanceFor(intent, goal?.identity_statement),
    disclaimer: intent === 'purchase' || intent === 'health' || intent === 'fear' ? DISCLAIMER : 'Reflective coaching only — you know your situation best.',
  }
}
