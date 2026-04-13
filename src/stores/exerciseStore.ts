import { create } from 'zustand'
import type { Exercise, ExerciseType } from '../types/exercise'
import type { ExerciseResult, AuraExample } from '../types/scoring'

type ExercisePhase =
  | 'loading'
  | 'ready'
  | 'in_progress'
  | 'recording'
  | 'processing'
  | 'scoring'
  | 'completed'
  | 'error'

interface ExerciseState {
  currentExercise: Exercise | null
  phase: ExercisePhase
  startTime: number | null
  elapsedSeconds: number
  transcription: string
  userInput: string // for writing exercises
  score: number | null
  result: ExerciseResult | null
  auraExample: AuraExample | null
  error: string | null

  // Timer
  timerInterval: ReturnType<typeof setInterval> | null

  // Actions
  setExercise: (exercise: Exercise) => void
  setPhase: (phase: ExercisePhase) => void
  startExercise: () => void
  setTranscription: (text: string) => void
  setUserInput: (text: string) => void
  setResult: (result: ExerciseResult) => void
  setAuraExample: (example: AuraExample) => void
  setError: (error: string) => void
  stopTimer: () => void
  reset: () => void
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  currentExercise: null,
  phase: 'loading',
  startTime: null,
  elapsedSeconds: 0,
  transcription: '',
  userInput: '',
  score: null,
  result: null,
  auraExample: null,
  error: null,
  timerInterval: null,

  setExercise: (exercise) => {
    set({ currentExercise: exercise, phase: 'ready', error: null })
  },

  setPhase: (phase) => set({ phase }),

  startExercise: () => {
    const now = Date.now()
    const interval = setInterval(() => {
      set({ elapsedSeconds: Math.floor((Date.now() - now) / 1000) })
    }, 1000)
    set({ phase: 'in_progress', startTime: now, timerInterval: interval })
  },

  setTranscription: (text) => set({ transcription: text }),

  setUserInput: (text) => set({ userInput: text }),

  setResult: (result) => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)
    set({
      result,
      score: result.score,
      phase: 'completed',
      timerInterval: null,
    })
  },

  setAuraExample: (example) => set({ auraExample: example }),

  setError: (error) => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)
    set({ error, phase: 'error', timerInterval: null })
  },

  stopTimer: () => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)
    set({ timerInterval: null })
  },

  reset: () => {
    const { timerInterval } = get()
    if (timerInterval) clearInterval(timerInterval)
    set({
      currentExercise: null,
      phase: 'loading',
      startTime: null,
      elapsedSeconds: 0,
      transcription: '',
      userInput: '',
      score: null,
      result: null,
      auraExample: null,
      error: null,
      timerInterval: null,
    })
  },
}))
