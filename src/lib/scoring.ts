import { FILLER_WORDS } from './constants'

/**
 * Calculate word-level Levenshtein distance for pronunciation accuracy
 */
export function wordLevelAccuracy(original: string, transcription: string): number {
  const origWords = normalizeText(original).split(/\s+/).filter(Boolean)
  const transWords = normalizeText(transcription).split(/\s+/).filter(Boolean)

  if (origWords.length === 0) return 0

  const distance = levenshteinDistance(origWords, transWords)
  const accuracy = Math.max(0, 1 - distance / origWords.length) * 100

  return Math.round(accuracy)
}

/**
 * Find missed words between original and transcription
 */
export function findMissedWords(original: string, transcription: string): string[] {
  const origWords = new Set(normalizeText(original).split(/\s+/).filter(Boolean))
  const transWords = new Set(normalizeText(transcription).split(/\s+/).filter(Boolean))

  return [...origWords].filter((w) => !transWords.has(w))
}

/**
 * Count filler words in transcription
 */
export function countFillerWords(transcription: string): { count: number; found: string[] } {
  const text = transcription.toLowerCase()
  const found: string[] = []
  let count = 0

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches) {
      count += matches.length
      found.push(...matches.map(() => filler))
    }
  }

  return { count, found: [...new Set(found)] }
}

/**
 * Calculate words per minute from transcription and duration
 */
export function calculateWPM(transcription: string, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0
  const wordCount = transcription.split(/\s+/).filter(Boolean).length
  return Math.round((wordCount / durationSeconds) * 60)
}

/**
 * Calculate fluency score based on WPM and filler words
 * Optimal range: 120-160 WPM for presentations, 140-180 for reading
 */
export function calculateFluency(
  wpm: number,
  fillerCount: number,
  totalWords: number,
  mode: 'reading' | 'speaking' = 'reading'
): number {
  // WPM scoring
  const [optimalMin, optimalMax] = mode === 'reading' ? [140, 180] : [120, 160]
  let wpmScore: number
  if (wpm >= optimalMin && wpm <= optimalMax) {
    wpmScore = 100
  } else if (wpm < optimalMin) {
    wpmScore = Math.max(0, 100 - (optimalMin - wpm) * 2)
  } else {
    wpmScore = Math.max(0, 100 - (wpm - optimalMax) * 2)
  }

  // Filler word penalty
  const fillerRatio = totalWords > 0 ? fillerCount / totalWords : 0
  const fillerPenalty = Math.min(fillerRatio * 500, 50) // up to 50% penalty

  return Math.round(Math.max(0, wpmScore - fillerPenalty))
}

/**
 * Calculate word count
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Calculate completeness for recitation (what % of original was reproduced)
 */
export function calculateCompleteness(original: string, recited: string): number {
  const origSentences = original.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const recitedLower = normalizeText(recited)

  let matchedSentences = 0
  for (const sentence of origSentences) {
    const normalizedSentence = normalizeText(sentence)
    const sentenceWords = normalizedSentence.split(/\s+/).filter(Boolean)
    // Check if at least 60% of the sentence words appear in recitation
    const matchedWords = sentenceWords.filter((w) => recitedLower.includes(w))
    if (matchedWords.length >= sentenceWords.length * 0.6) {
      matchedSentences++
    }
  }

  return origSentences.length > 0
    ? Math.round((matchedSentences / origSentences.length) * 100)
    : 0
}

// Helpers
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshteinDistance(a: string[], b: string[]): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}
