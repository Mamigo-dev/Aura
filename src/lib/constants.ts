export const APP_NAME = 'Aura'
export const APP_TAGLINE = 'Elevate Your English'
export const AURA_EXAMPLE_LABEL = 'Your Aura'

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export const CEFR_DESCRIPTIONS: Record<string, string> = {
  A1: 'Beginner - Basic phrases and everyday expressions',
  A2: 'Elementary - Routine tasks and simple descriptions',
  B1: 'Intermediate - Main points of clear standard input',
  B2: 'Upper Intermediate - Complex text and fluent interaction',
  C1: 'Advanced - Flexible and effective language use',
  C2: 'Proficiency - Near-native fluency and precision',
}

export const DEFAULT_DAILY_GOAL = 5
export const MAX_DAILY_GOAL = 20
export const MIN_DAILY_GOAL = 1

export const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'sort of', 'kind of',
  'basically', 'actually', 'literally', 'right', 'so', 'well',
  'I mean', 'you see',
]

export const SPEECH_RATES = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.3,
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aura-api.workers.dev'
