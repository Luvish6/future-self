import type { Category } from '../lib/types'
import { suggestAffirmations } from '../lib/engine/affirmations'

/** Built-in guided meditations ([pause N] = N seconds of silence). Plain, secular, evidence-informed wording. */
export const MEDITATIONS: { id: string; title: string; minutes: number; script: string }[] = [
  {
    id: 'breath', title: 'Calm breathing', minutes: 4,
    script: `Settle into a comfortable position and let your eyes close or soften. [pause 4]
Breathe in gently through your nose for a count of four… [pause 4] and out slowly for a count of six. [pause 6]
Again — in for four… [pause 4] out for six. [pause 6]
Longer out-breaths tell your body it is safe to slow down. [pause 5]
Keep this rhythm on your own for a while. [pause 30]
If your mind wanders, that’s normal. Notice where it went, and gently come back to the breath. [pause 30]
One more slow breath in… [pause 4] and out. [pause 6] When you’re ready, let your breathing return to its natural pace.`,
  },
  {
    id: 'body', title: 'Body scan for sleep', minutes: 7,
    script: `Lie down and let the bed or floor hold your weight. [pause 5]
Bring your attention to your feet. Notice any warmth, pressure, or tingling, without trying to change it. [pause 15]
Let that attention move up to your calves and knees… and let them soften. [pause 15]
Now your thighs and hips. Let them feel heavy. [pause 15]
Your stomach rises and falls with each breath. [pause 15]
Notice your chest, your back, your shoulders. Let your shoulders drop a little. [pause 15]
Your arms, your hands, your fingers — heavy and loose. [pause 15]
Your neck, your jaw — let your teeth part slightly. Your forehead smooths. [pause 15]
Now feel your whole body at once, breathing, resting. [pause 20]
There is nothing you need to do right now. You can let yourself drift. [pause 30]`,
  },
  {
    id: 'kindness', title: 'Kindness meditation', minutes: 5,
    script: `Sit or lie comfortably and take a slow breath. [pause 5]
Bring to mind someone who makes you feel safe or cared for. Picture their face. [pause 10]
Silently offer them these wishes: May you be safe. [pause 4] May you be healthy. [pause 4] May you live with ease. [pause 8]
Now offer the same wishes to yourself. May I be safe. [pause 4] May I be healthy. [pause 4] May I live with ease. [pause 10]
If that feels awkward, that’s okay — kindness toward ourselves is a skill that grows with practice. [pause 8]
Finally, widen the circle to people you don’t know well, and then to everyone. May we all be safe, healthy, and at ease. [pause 15]
Take one more breath, and notice how you feel right now. [pause 8]`,
  },
]

/** Built-in affirmation sets for night listening (no setup needed). Long pauses suit winding down. */
export const SLEEP_SETS: Category[] = ['self_love', 'love', 'confidence', 'peace', 'finance', 'career', 'academic', 'health']
export const sleepScript = (c: Category) => suggestAffirmations(c).map((a) => `${a} [pause 10]`).join(' ')
