/**
 * Situation-based structured guidance (template-driven, not AI). Phrased as possibilities
 * ("might", "could") — it never claims to know the user's future or the other person's mind.
 */
export type Intent =
  | 'ignored' | 'boundary' | 'rejection' | 'purchase' | 'procrastination' | 'setback'
  | 'conflict' | 'fear' | 'opportunity' | 'health' | 'priority' | 'decision'

export interface Guidance {
  interpret: string // how the desired future self might read the situation
  regulate: string // settling emotions first
  healthy: string // what a healthy response could look like
  boundaries: string
  say: string[] // optional example words
  avoid: string[] // impulsive moves to skip
  action: string // one small next step
}

const G: Record<Intent, Guidance> = {
  ignored: {
    interpret: 'might acknowledge the hurt without immediately assuming rejection. Silence often has ordinary causes — busyness, stress, or simply a different style — and your worth doesn’t depend on one person’s response.',
    regulate: 'Name the feeling (“I feel hurt and a bit anxious”), take a few slow breaths, and wait until the first wave passes before replying.',
    healthy: 'Share how you feel clearly and kindly, ask rather than accuse, and respect that the other person has their own pace and life.',
    boundaries: 'You can ask for what you need. If being overlooked becomes a pattern, it’s okay to invest more energy in relationships that are mutual.',
    say: ['“I’ve missed hearing from you. Is everything okay?”', '“When plans fall through without a message, I feel unimportant. Could we let each other know?”'],
    avoid: ['Sending many messages in a row', 'Checking their social media for clues', 'Deciding what it “means” before you’ve talked'],
    action: 'Send one calm, honest message — or, if it’s not the right time, write what you want to say in your journal first.',
  },
  boundary: {
    interpret: 'might see a boundary as a way to protect the relationship, not end it. Saying no to one thing is saying yes to your energy and values.',
    regulate: 'Notice guilt or fear of disappointing someone — that’s normal. Remind yourself that a respectful no is not unkind.',
    healthy: 'State the boundary simply, without over-explaining, and offer an alternative if you genuinely want to.',
    boundaries: 'Decide in advance what you’ll do if the boundary isn’t respected (e.g. leave the conversation, step back).',
    say: ['“I can’t take that on this week.”', '“I care about you, and I need to stop this conversation when it turns into shouting.”', '“That doesn’t work for me — could we try this instead?”'],
    avoid: ['Apologizing repeatedly', 'Saying yes now and resenting it later', 'Setting a boundary in the heat of anger'],
    action: 'Pick one small situation this week where you’ll practise a clear, kind no.',
  },
  rejection: {
    interpret: 'might treat this as information and a hard moment — not a verdict on your worth. Most people who succeed collect many rejections along the way.',
    regulate: 'Let yourself feel disappointed for a while. Talk to someone supportive or move your body before deciding what it means.',
    healthy: 'Ask for feedback if possible, note one thing to improve, and keep your pipeline moving instead of stopping.',
    boundaries: 'Limit how long you replay it. Set a time to reflect, then return to action.',
    say: ['“Thank you for considering me. If you’re open to it, I’d appreciate any feedback for next time.”'],
    avoid: ['Generalizing (“I’ll never get anywhere”)', 'Firing off an emotional reply', 'Stopping all applications'],
    action: 'Write down one lesson and take one small step forward today (one application, one message, one practice session).',
  },
  purchase: {
    interpret: 'might enjoy money without letting a moment’s impulse decide. Financial security comes from many ordinary choices, not from looking wealthy.',
    regulate: 'Notice what you’re feeling — excitement, stress, boredom, comparison. Pause before paying.',
    healthy: 'Check it against your budget and priorities. If it fits and you’ll value it, buying it can be a fine choice.',
    boundaries: 'A personal rule can help, like a 24-hour wait for non-essentials over a set amount.',
    say: ['To yourself: “If I still want it in 24 hours and it fits my plan, I’ll buy it.”'],
    avoid: ['Buying on credit you can’t repay this month', 'Spending to keep up with others', 'Shopping to soothe a bad day'],
    action: 'Add it to a wishlist with today’s date and revisit it tomorrow.',
  },
  procrastination: {
    interpret: 'might see avoidance as a signal (the task feels unclear, big, or uncomfortable), not as laziness.',
    regulate: 'Acknowledge the resistance. One slow breath, then lower the bar.',
    healthy: 'Shrink the first step until it’s almost too easy, and start before you feel ready.',
    boundaries: 'Protect a short focus window from notifications and other people’s requests.',
    say: ['To yourself: “I only need to start for two minutes.”'],
    avoid: ['Waiting for motivation', 'Rewriting the whole plan instead of starting', 'All-or-nothing thinking'],
    action: 'Set a two-minute timer and do the very first physical step now.',
  },
  setback: {
    interpret: 'might treat a lapse as normal and expected, not as proof the goal is out of reach.',
    regulate: 'Speak to yourself the way you’d speak to a friend who slipped.',
    healthy: 'Look at what got in the way and make the next attempt easier.',
    boundaries: 'Avoid the “I’ve already failed, so why bother” spiral — one miss rarely matters; two in a row is the thing to avoid.',
    say: ['To yourself: “That happened. What’s the smallest restart?”'],
    avoid: ['Punishing yourself with a harder plan', 'Quitting the whole goal', 'Hiding it from yourself'],
    action: 'Do the smallest version of your habit today.',
  },
  conflict: {
    interpret: 'might stay curious about the other person’s view while still standing up for your own.',
    regulate: 'If you feel flooded, take a break before continuing. Calm conversations go further.',
    healthy: 'Describe what happened, how you felt, and what you’d like — without blaming.',
    boundaries: 'It’s okay to pause a conversation that becomes disrespectful. If you ever feel unsafe, prioritize your safety and reach out for help.',
    say: ['“When ___ happened, I felt ___. Could we try ___?”', '“I want to understand your side. Can you tell me what it was like for you?”'],
    avoid: ['Bringing up every past issue', 'Mind-reading their motives', 'Discussing it over text while upset'],
    action: 'Write your first sentence for the conversation and choose a calm time to have it.',
  },
  fear: {
    interpret: 'might feel nervous and act anyway — courage is acting with fear, not without it.',
    regulate: 'Slow your breathing (longer exhale than inhale) and ground yourself in what you can see and feel.',
    healthy: 'Prepare the part you control, then take a smaller step if the full one feels too big.',
    boundaries: 'You don’t have to be perfect or fearless; you only have to show up for the next small step.',
    say: ['“I’d like to add something.”', '“I have a question about that.”', 'To yourself: “Nervous is okay. I can still speak.”'],
    avoid: ['Waiting until you feel no fear', 'Over-preparing as a way to avoid starting', 'Comparing your inside to others’ outside'],
    action: 'Choose one moment today to say one sentence out loud — a question, an idea, or a greeting.',
  },
  opportunity: {
    interpret: 'might weigh the choice against long-term values rather than short-term fear or excitement.',
    regulate: 'Notice urgency. Most decisions can wait a day.',
    healthy: 'Gather the missing information, talk to someone experienced, and decide by a set date.',
    boundaries: 'You can ask for time to decide.',
    say: ['“Thank you — could I have until Friday to give you an answer?”'],
    avoid: ['Deciding under pressure', 'Ignoring what you’d give up', 'Choosing only to avoid disappointing someone'],
    action: 'List the top three factors that matter to you and score each option.',
  },
  health: {
    interpret: 'might choose what supports tomorrow’s energy, without all-or-nothing rules.',
    regulate: 'Ask what you actually need right now — rest, food, comfort, connection?',
    healthy: 'Pick a “good enough” option that meets the real need.',
    boundaries: 'Rest is part of progress. For medical concerns, talk to a health professional.',
    say: ['To yourself: “What would help me feel better tomorrow morning?”'],
    avoid: ['Punishing yourself after a choice', 'Extreme fixes', 'Skipping sleep to catch up'],
    action: 'Make the healthier option easier for later today (water out, shoes by the door, earlier alarm for bed).',
  },
  priority: {
    interpret: 'might protect time for what matters most and let some things be good enough.',
    regulate: 'Overwhelm shrinks when it’s written down. Get everything out of your head first.',
    healthy: 'Choose one priority for the next block of time; schedule or drop the rest.',
    boundaries: 'Saying no to some requests is how you say yes to your goals.',
    say: ['“I can do that next week, but not today.”'],
    avoid: ['Multitasking everything at once', 'Saying yes by default', 'Skipping all rest'],
    action: 'Write your top three for today and start the first one.',
  },
  decision: {
    interpret: 'might choose the option most consistent with the person you’re becoming — while accepting that no choice is perfect.',
    regulate: 'Give yourself a moment of calm before deciding.',
    healthy: 'Clarify the options, the values involved, and what’s reversible.',
    boundaries: 'Other people’s opinions are input, not instructions.',
    say: ['To yourself: “Which choice will I be glad I made in a year?”'],
    avoid: ['Deciding to avoid discomfort', 'Endless research', 'Ignoring your own values'],
    action: 'Write the options down and choose a time to decide.',
  },
}

/** Turn an identity statement into a third-person lens; never claims to be the user's real future. */
export function futureLens(identity?: string): string {
  const m = identity?.match(/becoming (?:someone|a \w+|an \w+) who (.+?)(?:\s+—|\.|$)/i)
  if (!m) return 'The person you’re becoming'
  const second = m[1].trim()
    .replace(/\bmyself\b/gi, 'yourself').replace(/\bmy\b/gi, 'your').replace(/\bmine\b/gi, 'yours')
    .replace(/\bme\b/gi, 'you').replace(/\bI’m\b|\bI'm\b|\bI am\b/g, 'you’re').replace(/\bI\b/g, 'you')
  return `A version of you who ${second}`
}

export function guidanceFor(intent: Intent, identity?: string): Guidance {
  const g = G[intent]
  return { ...g, interpret: `${futureLens(identity)} ${g.interpret}` }
}

export type FollowUp = 'say' | 'calm' | 'worse' | 'smaller' | 'why'
export const FOLLOW_UPS: { id: FollowUp; label: string }[] = [
  { id: 'say', label: 'What could I say?' },
  { id: 'calm', label: 'How do I calm down first?' },
  { id: 'worse', label: 'What if it goes badly?' },
  { id: 'smaller', label: 'Give me a smaller step' },
  { id: 'why', label: 'Why does this help?' },
]

/** Deterministic follow-up answers built from the same guidance. */
export function followUp(intent: Intent, kind: FollowUp): { title: string; lines: string[] } {
  const g = G[intent]
  switch (kind) {
    case 'say': return { title: 'Example words (adapt them to your voice)', lines: [...g.say, 'Keep it short, specific, and about your experience rather than their character.'] }
    case 'calm': return { title: 'Settle first', lines: [g.regulate, 'Try: breathe in for 4, out for 6, five times. Then decide whether to act now or later.'] }
    case 'worse': return { title: 'If it doesn’t go the way you hoped', lines: ['You can only control your part: being clear, kind, and honest.', g.boundaries, 'Afterwards, write down what you learned — handling a hard moment well is still progress.'] }
    case 'smaller': return { title: 'An even smaller step', lines: [`Instead of “${g.action}”, try just the first minute of it — or write it down as a plan for tomorrow.`, 'Small steps still count as evidence of who you’re becoming.'] }
    case 'why': return { title: 'Why this approach', lines: ['Pausing before reacting gives your thinking brain time to catch up with strong emotions.', 'Specific if-then plans and small actions make follow-through much more likely than general intentions.', 'This is structured guidance from common coaching and psychology frameworks — not a prediction, and not professional advice.'] }
  }
}
