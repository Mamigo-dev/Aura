export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type AIProvider = 'claude' | 'gpt'

export type SearchProvider = 'brave' | 'newsapi' | 'perplexity' | 'google'

export interface UserProfile {
  id: string
  createdAt: string
  level: EnglishLevel
  sublevelScore: number // 0-100 within level
  selectedCategories: string[] // category IDs
  dailyGoal: number // exercises per day (default 5)
  streak: number
  longestStreak: number
  totalDaysActive: number
  totalExercisesCompleted: number
  preferences: UserPreferences
  assessment?: LevelAssessment
}

export interface UserPreferences {
  speechRate: number // 0.5 - 2.0
  notificationsEnabled: boolean
  notificationTime: string // HH:mm format
  aiProvider: AIProvider
  searchProviders: SearchProvider[]
  apiKeys: Partial<Record<AIProvider | SearchProvider, string>>
  ttsVoice: string // OpenAI TTS voice: alloy, echo, fable, nova, onyx, shimmer
}

export interface LevelAssessment {
  completedAt: string
  scores: {
    vocabulary: number // 0-100
    grammar: number
    comprehension: number
    dailyExpressions: number
    technicalVocab: number
    idioms: number
  }
  assignedLevel: EnglishLevel
  weakAreas: WeakArea[]
  recommendations: string[]
}

export type WeakArea =
  | 'daily_expressions'
  | 'pronunciation'
  | 'public_speaking'
  | 'grammar'
  | 'idioms'
  | 'vocabulary'
  | 'writing'
  | 'listening'

export interface DailyProgress {
  date: string // YYYY-MM-DD
  exercisesCompleted: number
  exercisesGoal: number
  totalScore: number
  averageScore: number
  exerciseTypes: Record<string, number>
  timeSpentMinutes: number
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  speechRate: 1.0,
  notificationsEnabled: false,
  notificationTime: '09:00',
  aiProvider: 'claude',
  searchProviders: ['brave', 'newsapi'],
  apiKeys: {},
  ttsVoice: 'nova',
}

export function createDefaultProfile(): UserProfile {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    level: 'B1',
    sublevelScore: 50,
    selectedCategories: [],
    dailyGoal: 5,
    streak: 0,
    longestStreak: 0,
    totalDaysActive: 0,
    totalExercisesCompleted: 0,
    preferences: { ...DEFAULT_PREFERENCES },
  }
}
