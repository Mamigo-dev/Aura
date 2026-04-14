import type { ExerciseType } from './exercise'

export interface ExerciseResult {
  id: string
  exerciseId: string
  userId: string
  completedAt: string
  score: number // 0-100
  passed: boolean
  timeSpentSeconds: number
  details: ScoringDetails
  auraExample?: AuraExample
}

export type ScoringDetails =
  | ReadAloudScore
  | ReadingComprehensionScore
  | RecitationScore
  | WritingScore
  | SpeechModeScore

export interface ReadAloudScore {
  type: 'read_aloud'
  transcription: string
  accuracy: number
  fluency: number
  pronunciation: number
  missedWords: string[]
  mispronounced: MispronunciationDetail[]
  overallFeedback: string
  // AI-powered detailed feedback (optional, populated when AI available)
  whisperTranscription?: string // More accurate transcript from OpenAI Whisper
  wordAnalysis?: WordAnalysis[]
  intonationFeedback?: IntonationFeedback[]
  rhythmAnalysis?: RhythmAnalysis
  pronunciationCoaching?: string
  connectedSpeech?: string
}

// Re-export for backward compatibility - old code uses 'added' which still works

export interface MispronunciationDetail {
  word: string
  said: string
  expected: string
  tip?: string
}

export interface WordAnalysis {
  word: string
  expected: string
  status: 'correct' | 'accent_issue' | 'mispronounced' | 'missed' | 'added'
  confidence?: number
  ipa?: string
  offsetMs?: number   // start time in recording (milliseconds)
  durationMs?: number // word duration in recording (milliseconds)
  tip?: string
}

export interface IntonationFeedback {
  sentenceIndex: number
  sentence: string
  expectedPattern: 'rising' | 'falling' | 'rise-fall' | 'flat'
  actualPattern: 'rising' | 'falling' | 'rise-fall' | 'flat'
  feedback: string
}

export interface RhythmAnalysis {
  wpm: number
  optimalWpmRange: [number, number]
  pauseCount: number
  longPauses: { time: number; duration: number }[]
  fillerWords: string[]
  paceVariation: number
  feedback: string
}

export interface ReadingComprehensionScore {
  type: 'reading_comprehension'
  answers: { questionId: string; selectedIndex: number; correct: boolean }[]
  correctCount: number
  totalQuestions: number
}

export interface RecitationScore {
  type: 'recitation'
  transcription: string
  completeness: number
  accuracy: number
  fluency: number
  missedSentences: string[]
  overallFeedback: string
}

export interface WritingScore {
  type: 'writing'
  grammar: number // 0-20
  vocabulary: number
  coherence: number
  taskFulfillment: number
  style: number
  wordCount: number
  overallFeedback: string
  sentenceFeedback: SentenceFeedback[]
}

export interface SentenceFeedback {
  sentence: string
  feedback: string
  improved: string
}

export interface SpeechModeScore {
  type: 'speech_mode'
  transcription: string
  delivery: number // 0-100
  structure: number
  fillerWords: number // inverse: fewer fillers = higher score
  pace: number
  wordsPerMinute: number
  fillerCount: number
  fillerList: string[]
  overallFeedback: string
  structureFeedback: string
}

export interface AuraExample {
  content: string
  highlights: string[]
  explanation: string
}

export function calculateOverallScore(
  type: ExerciseType,
  details: ScoringDetails
): number {
  switch (type) {
    case 'read_aloud': {
      const d = details as ReadAloudScore
      return Math.round(d.accuracy * 0.4 + d.fluency * 0.3 + d.pronunciation * 0.3)
    }
    case 'reading_comprehension': {
      const d = details as ReadingComprehensionScore
      return Math.round((d.correctCount / d.totalQuestions) * 100)
    }
    case 'recitation': {
      const d = details as RecitationScore
      return Math.round(d.completeness * 0.5 + d.accuracy * 0.3 + d.fluency * 0.2)
    }
    case 'writing': {
      const d = details as WritingScore
      return d.grammar + d.vocabulary + d.coherence + d.taskFulfillment + d.style
    }
    case 'speech_mode': {
      const d = details as SpeechModeScore
      return Math.round(d.delivery * 0.3 + d.structure * 0.25 + d.fillerWords * 0.2 + d.pace * 0.25)
    }
  }
}
