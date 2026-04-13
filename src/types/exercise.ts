import type { EnglishLevel } from './user'

export type ExerciseType =
  | 'read_aloud'
  | 'reading_comprehension'
  | 'recitation'
  | 'writing'
  | 'speech_mode'

export interface Exercise {
  id: string
  type: ExerciseType
  level: EnglishLevel
  categoryPath: [string, string, string] // 3-level category IDs
  title: string
  description: string
  content: ExerciseContent
  passingScore: number
  timeLimit?: number // seconds
  createdAt: string
  source?: string // URL if from web search
  isFreshContent?: boolean
}

export type ExerciseContent =
  | ReadAloudContent
  | ReadingComprehensionContent
  | RecitationContent
  | WritingContent
  | SpeechModeContent

export interface ReadAloudContent {
  type: 'read_aloud'
  passage: string
  keyPhrases: string[]
  phoneticsHints: Record<string, string> // word -> IPA
  difficulty: string
}

export interface ReadingComprehensionContent {
  type: 'reading_comprehension'
  passage: string
  questions: ComprehensionQuestion[]
}

export interface ComprehensionQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface RecitationContent {
  type: 'recitation'
  passage: string
  hints: string[] // first words of each sentence
  keyVocabulary: VocabularyItem[]
}

export interface VocabularyItem {
  word: string
  definition: string
  example: string
  pronunciation?: string
}

export interface WritingContent {
  type: 'writing'
  prompt: string
  context: string
  minWords: number
  maxWords: number
  rubric: WritingRubric
}

export interface WritingRubric {
  grammar: { weight: number; description: string }
  vocabulary: { weight: number; description: string }
  coherence: { weight: number; description: string }
  taskFulfillment: { weight: number; description: string }
  style: { weight: number; description: string }
}

export interface SpeechModeContent {
  type: 'speech_mode'
  topic: string
  outline: SpeechOutline
  prepTime: number // seconds
  speechTime: number // seconds
  isImpromptu: boolean
  tips: string[]
}

export interface SpeechOutline {
  introduction: string
  bodyPoints: string[]
  conclusion: string
  suggestedTransitions: string[]
}

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  read_aloud: 'Read Aloud',
  reading_comprehension: 'Reading',
  recitation: 'Recitation',
  writing: 'Writing',
  speech_mode: 'Speech',
}

export const EXERCISE_TYPE_ICONS: Record<ExerciseType, string> = {
  read_aloud: 'mic',
  reading_comprehension: 'book-open',
  recitation: 'brain',
  writing: 'pen-tool',
  speech_mode: 'presentation',
}

export const PASSING_SCORES: Record<ExerciseType, number> = {
  read_aloud: 70,
  reading_comprehension: 60,
  recitation: 65,
  writing: 60,
  speech_mode: 65,
}
