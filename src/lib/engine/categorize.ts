import type { Category } from '../types'

const KEYWORDS: Record<Exclude<Category, 'general' | 'custom'>, string[]> = {
  self_love: ['self-love', 'self love', 'self-worth', 'self worth', 'worthy', 'accept myself', 'self-compassion', 'inner critic', 'love myself'],
  love: ['feel loved', 'loved', 'belong', 'affection', 'romance', 'romantic', 'cared for', 'love'],
  finance: ['money', 'financ', 'save', 'saving', 'debt', 'invest', 'budget', 'income', 'wealth', 'rich', 'afford', 'spend', 'salary', 'buy', 'purchase', 'expensive'],
  confidence: ['confiden', 'shy', 'anxious', 'speak', 'social', 'assert', 'self-esteem', 'courage', 'public', 'nervous'],
  productivity: ['productiv', 'focus', 'procrastinat', 'distract', 'organized', 'discipline', 'time management', 'deadline'],
  health: ['health', 'fit', 'exercise', 'weight', 'sleep', 'run', 'gym', 'diet', 'eat', 'energy', 'walk'],
  career: ['career', 'job', 'promotion', 'business', 'startup', 'interview', 'boss', 'work', 'client', 'founder'],
  academic: ['exam', 'grade', 'gpa', 'university', 'college', 'school', 'class', 'semester', 'academic', 'homework', 'thesis'],
  peace: ['peace', 'calm', 'stress', 'balance', 'overthink', 'mindful', 'relax', 'overwhelm', 'emotional'],
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
  love: 'Love & belonging', self_love: 'Self-love', confidence: 'Confidence', finance: 'Financial independence',
  career: 'Career', academic: 'Academic success', health: 'Health & wellness', peace: 'Peace & balance',
  relationships: 'Relationships', productivity: 'Productivity', learning: 'Learning', creativity: 'Creativity',
  general: 'Personal growth', custom: 'Custom',
}

/** Small, adjustable starter actions per category, sized in minutes. */
export const HABIT_LIBRARY: Record<Category, { title: string; minutes: number }[]> = {
  love: [
    { title: 'Reach out to someone you care about', minutes: 5 },
    { title: 'Express appreciation to someone', minutes: 2 },
    { title: 'Write down one moment of connection', minutes: 3 },
    { title: 'Practice active listening in one conversation', minutes: 10 },
  ],
  self_love: [
    { title: 'Practice compassionate self-talk', minutes: 3 },
    { title: 'Note one thing you handled well today', minutes: 3 },
    { title: 'Do one kind thing for your body', minutes: 10 },
    { title: 'Say no to one thing that drains you', minutes: 1 },
  ],
  academic: [
    { title: 'Focused study block (phone away)', minutes: 25 },
    { title: 'Test yourself instead of rereading', minutes: 15 },
    { title: 'Review today’s class notes', minutes: 10 },
    { title: 'Plan tomorrow’s study task', minutes: 5 },
  ],
  peace: [
    { title: 'Slow breathing for two minutes', minutes: 2 },
    { title: 'Short walk without your phone', minutes: 10 },
    { title: 'Write down what’s on your mind', minutes: 5 },
    { title: 'Pause before reacting to one stressor', minutes: 1 },
  ],
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
  custom: [],
}
HABIT_LIBRARY.custom = HABIT_LIBRARY.general
