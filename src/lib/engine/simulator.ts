import { detectIntent } from './advisor'
import { guidanceFor } from './guidance'
import type { VizInput } from './visualization'

/** Future Self Simulator: structured rehearsal for a real upcoming situation (preparation, not avoidance). */
export interface Simulation {
  situation: string
  when: string
  place: string
  people: string
  showUpAs: string
  obstacles: string[]
  responses: Record<string, string>
  words: string
  action: string
  actionWhen: string
}

const OBSTACLES: Record<string, string[]> = {
  fear: ['My mind goes blank', 'My voice shakes', 'Someone disagrees or challenges me', 'I want to stay quiet'],
  ignored: ['They don’t reply', 'They seem distant', 'I start assuming the worst'],
  boundary: ['They push back or seem hurt', 'I feel guilty and want to say yes', 'I over-explain'],
  rejection: ['I start doubting myself', 'I want to give up', 'I compare myself to others'],
  conflict: ['They get defensive', 'I get angry', 'The conversation goes off track'],
  purchase: ['I see a sale and feel urgency', 'I’m stressed and want comfort', 'Friends are spending'],
  procrastination: ['I don’t know where to start', 'I get distracted', 'It feels too big'],
  default: ['I feel nervous', 'Things don’t go to plan', 'I’m tempted to avoid it'],
}

const RESPONSES: [RegExp, string][] = [
  [/blank|forget/i, 'pause, glance at my notes, and say my first prepared sentence'],
  [/shak|nervous|anxious/i, 'breathe out slowly and keep going — nervous is okay'],
  [/disagree|challeng|push back|defensive/i, 'listen, acknowledge their point, and calmly restate mine'],
  [/quiet|avoid|give up/i, 'take the smallest version of the step anyway'],
  [/guilt|yes/i, 'remind myself that a kind no is still kind, and repeat my boundary once'],
  [/over-?explain/i, 'say it in one sentence and stop'],
  [/reply|distant|assum/i, 'wait before reacting and ask instead of assuming'],
  [/angry/i, 'ask for a short break and come back when I’m calmer'],
  [/urgency|sale|spending|comfort/i, 'wait 24 hours and check it against my goals'],
  [/start|big/i, 'do only the first two-minute step'],
  [/distract/i, 'put my phone in another room for one focus block'],
  [/doubt|compare/i, 'look at my evidence journal and name one thing I’ve already done'],
]

export function obstaclesFor(situation: string): string[] {
  return OBSTACLES[detectIntent(situation)] ?? OBSTACLES.default
}

export function responseFor(obstacle: string): string {
  return RESPONSES.find(([re]) => re.test(obstacle))?.[1] ?? 'pause, breathe, and take the next small step'
}

export function suggestedWords(situation: string): string {
  return guidanceFor(detectIntent(situation)).say.join('\n')
}

export function summarize(s: Simulation): string {
  const lines = [
    `Situation: ${s.situation}${s.when ? ` (${s.when})` : ''}`,
    s.place || s.people ? `Scene: ${[s.place, s.people && `with ${s.people}`].filter(Boolean).join(', ')}` : '',
    s.showUpAs ? `How I want to show up: ${s.showUpAs}` : '',
    s.obstacles.length ? `If-then plans:\n${s.obstacles.map((o) => `• If ${o.toLowerCase()}, then I will ${s.responses[o] || responseFor(o)}.`).join('\n')}` : '',
    s.words.trim() ? `What I’ll say:\n${s.words.trim()}` : '',
    `My real-world action: ${s.action}${s.actionWhen ? ` — ${s.actionWhen}` : ''}`,
  ]
  return lines.filter(Boolean).join('\n\n')
}

/** Turn the rehearsal into a narrated visualization script input. */
export function toVizInput(s: Simulation, goal: string, identity: string): VizInput {
  const first = s.obstacles[0]
  return {
    goal: goal || s.situation,
    identity,
    behavior: s.showUpAs ? `${s.situation.replace(/[.?!]+$/, '')}, showing up ${s.showUpAs}` : s.situation.replace(/[.?!]+$/, ''),
    obstacle: first ? first.toLowerCase() : 'a moment of doubt',
    response: first ? s.responses[first] || responseFor(first) : 'pause, breathe, and continue',
    place: [s.place, s.people && `with ${s.people}`].filter(Boolean).join(' ') || '',
    duration_min: 5,
  }
}
