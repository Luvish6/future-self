// Field names are snake_case so rows map 1:1 to Supabase columns.
export type ID = string

export interface Base {
  id: ID
  created_at: string
}

export type Category =
  | 'love' | 'self_love' | 'confidence' | 'finance' | 'career' | 'academic' | 'health' | 'peace'
  | 'relationships' | 'productivity' | 'learning' | 'creativity' | 'general' | 'custom'

/** Goal World palette; any goal may use any theme (no forced colors). */
export type WorldTheme = 'neutral' | 'love' | 'confidence' | 'finance' | 'peace' | 'career'

export interface Onboarding {
  goal: string
  why: string
  ideal_life: string
  behaviors: string
  obstacles: string
  fears: string
  habits_to_change: string
  minutes_per_day: number
  constraints: string
  progress_signal: string
}

export interface Profile extends Base {
  display_name: string
  onboarding: Onboarding | null
  core_values: string[]
}

export interface Milestone { id: ID; title: string; done: boolean }

export interface Goal extends Base {
  title: string
  category: Category
  why: string
  identity_statement: string
  target_date: string | null
  status: 'active' | 'paused' | 'done'
  milestones: Milestone[]
  theme: WorldTheme
}

export interface Affirmation extends Base {
  goal_id: ID | null
  text: string
  audio_key: string | null // IndexedDB blob key (recordings stay on device)
  is_favorite: boolean
}

export interface Visualization extends Base {
  goal_id: ID | null
  title: string
  script: string
  duration_min: number
}

export interface Habit extends Base {
  goal_id: ID | null
  title: string
  cue: string
  minutes: number
  days: number[] // 0=Sun..6=Sat; empty = every day
  active: boolean
}

export interface HabitLog extends Base {
  habit_id: ID
  log_date: string // YYYY-MM-DD local
}

export type JournalKind = 'reflection' | 'gratitude' | 'letter' | 'win' | 'obstacle' | 'lesson' | 'weekly'

export interface JournalEntry extends Base {
  goal_id: ID | null
  kind: JournalKind
  title: string
  body: string
  mood: number | null
  open_on: string | null // future-self letters can be sealed until a date
}

export type BlockKind = 'sleep' | 'work' | 'study' | 'commute' | 'family' | 'exercise' | 'meal' | 'free' | 'other'

export interface RoutineBlock extends Base {
  goal_id: ID | null
  weekday: number // 0..6
  start: string // HH:MM
  end: string
  label: string
  kind: BlockKind
}

export interface AudioSession extends Base {
  goal_id: ID | null
  title: string
  duration_s: number
}

export interface VisionItem extends Base {
  goal_id: ID | null
  kind: 'image' | 'quote' | 'milestone' | 'description'
  text: string
  image: string | null // compressed data URL
  category: Category
}

export interface Collections {
  profiles: Profile
  goals: Goal
  affirmations: Affirmation
  visualizations: Visualization
  habits: Habit
  habit_logs: HabitLog
  journal_entries: JournalEntry
  routine_blocks: RoutineBlock
  audio_sessions: AudioSession
  vision_items: VisionItem
}
export type CollectionName = keyof Collections
export const COLLECTIONS: CollectionName[] = [
  'profiles', 'goals', 'affirmations', 'visualizations', 'habits', 'habit_logs',
  'journal_entries', 'routine_blocks', 'audio_sessions', 'vision_items',
]
