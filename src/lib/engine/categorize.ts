import type { Category } from '../types'

const KEYWORDS: Record<Exclude<Category, 'general'>, string[]> = {
  finance: ['money', 'financ', 'save', 'saving', 'debt', 'invest', 'budget', 'income', 'wealth', 'rich', 'afford', 'spend', 'salary', 'buy', 'purchase', 'expensive'],
  confidence: ['confiden', 'shy', 'anxious', 'speak', 'social', 'assert', 'self-esteem', 'courage', 'public', 'nervous'],
  productivity: ['productiv', 'focus', 'procrastinat', 'distract', 'organized', 'discipline', 'time management', 'deadline'],
  health: ['health', 'fit', 'exercise', 'weight', 'sleep', 'run', 'gym', 'diet', 'eat', 'energy', 'walk'],
  career: ['career', 'job', 'promotion', 'business', 'startup', 'interview', 'boss', 'work', 'client', 'founder'],
  learning: ['learn', 'study', 'skill', 'course', 'exam', 'read', 'language', 'code', 'coding', 'degree'],
  relationships: ['relationship', 'friend', 'partner', 'family', 'dating', 'connect', 'lonely', 'parent'],
  creativity: ['creat', 'write', 'writing', 'art', 'music', 'design', 'paint', 'novel', 'content'],
}

/** Score keyword hits; ties resolve by declaration order. */
export function categorize(text: string): Category {
  const t = text.toLowerCase()
  let best: Category = 'general'
  let bestScore = 0
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    const score = words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)
    if (score > bestScore) {
      best = cat as Category
      bestScore = score
    }
  }
  return best
}

export const CATEGORY_LABEL: Record<Category, string> = {
  finance: 'Financial security', confidence: 'Confidence', productivity: 'Productivity',
  health: 'Health & energy', career: 'Career', learning: 'Learning', relationships: 'Relationships',
  creativity: 'Creativity', general: 'Personal growth',
}

/** Small, adjustable starter actions per category, sized in minutes. */
export const HABIT_LIBRARY: Record<Category, { title: string; minutes: number }[]> = {
  finance: [
    { title: 'Review yesterday’s spending', minutes: 5 },
    { title: 'Move a small amount to savings', minutes: 2 },
    { title: 'Learn one money concept', minutes: 15 },
    { title: 'Wait 24h before non-essential purchases', minutes: 1 },
  ],
  confidence: [
    { title: 'Start one small conversation', minutes: 5 },
    { title: 'Rehearse a challenging conversation', minutes: 10 },
    { title: 'Note one interaction that went well', minutes: 3 },
    { title: 'Share one opinion out loud', minutes: 2 },
  ],
  productivity: [
    { title: 'Pick today’s top 3 priorities', minutes: 5 },
    { title: 'One distraction-free focus block', minutes: 25 },
    { title: 'Phone in another room while working', minutes: 1 },
    { title: 'End-of-day shutdown review', minutes: 5 },
  ],
  health: [
    { title: 'Take a brisk walk', minutes: 15 },
    { title: 'Drink a glass of water on waking', minutes: 1 },
    { title: 'Stretch or mobility session', minutes: 10 },
    { title: 'Screens off 30 min before bed', minutes: 1 },
  ],
  career: [
    { title: 'Work on your most valuable skill', minutes: 20 },
    { title: 'Reach out to one person in your field', minutes: 10 },
    { title: 'Write down one work win', minutes: 3 },
    { title: 'Plan tomorrow’s key task', minutes: 5 },
  ],
  learning: [
    { title: 'Focused learning session', minutes: 20 },
    { title: 'Recall what you learned yesterday', minutes: 5 },
    { title: 'Practice, don’t just review', minutes: 15 },
    { title: 'Read 10 pages', minutes: 15 },
  ],
  relationships: [
    { title: 'Send a thoughtful message', minutes: 3 },
    { title: 'Give someone your full attention', minutes: 15 },
    { title: 'Express appreciation to someone', minutes: 2 },
    { title: 'Plan time together', minutes: 5 },
  ],
  creativity: [
    { title: 'Create something, however small', minutes: 15 },
    { title: 'Capture three ideas', minutes: 5 },
    { title: 'Study one work you admire', minutes: 10 },
    { title: 'Share a draft with someone', minutes: 5 },
  ],
  general: [
    { title: 'Write a short reflection', minutes: 5 },
    { title: 'Do one small thing toward your goal', minutes: 10 },
    { title: 'Visualize your next step', minutes: 5 },
    { title: 'Review your goal and why', minutes: 2 },
  ],
}
