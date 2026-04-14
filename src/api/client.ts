import { API_BASE_URL } from '../lib/constants'
import { addToOfflineQueue } from '../lib/db'
import type { AIProvider, SearchProvider } from '../types/user'

interface APIRequestOptions {
  provider?: AIProvider
  searchProvider?: SearchProvider
  apiKey?: string
}

async function apiRequest<T>(
  endpoint: string,
  payload: unknown,
  options: APIRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.apiKey) {
    headers['X-API-Key'] = options.apiKey
  }

  const body = JSON.stringify({
    ...((payload as object) || {}),
    provider: options.provider || 'claude',
    searchProvider: options.searchProvider,
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error ${response.status}: ${error}`)
    }

    return response.json()
  } catch (error) {
    if (!navigator.onLine) {
      await addToOfflineQueue(endpoint, payload)
      throw new Error('You are offline. Your request has been queued and will be processed when you reconnect.')
    }
    throw error
  }
}

// Level Assessment
export async function assessLevel(
  answers: Record<string, string>,
  options?: APIRequestOptions
) {
  return apiRequest<{
    level: string
    scores: Record<string, number>
    weakAreas: string[]
    recommendations: string[]
  }>('/api/assess', { answers }, options)
}

// Content Generation
export async function generateExercise(
  params: {
    type: string
    level: string
    categoryPath: [string, string, string]
    topic?: string
  },
  options?: APIRequestOptions
) {
  return apiRequest('/api/generate', params, options)
}

// Pronunciation Scoring
export async function scorePronunciation(
  params: {
    originalText: string
    transcription: string
    keyPhrases: string[]
  },
  options?: APIRequestOptions
) {
  return apiRequest('/api/score/pronunciation', params, options)
}

// Writing Scoring
export async function scoreWriting(
  params: {
    prompt: string
    submission: string
    level: string
    rubric: unknown
  },
  options?: APIRequestOptions
) {
  return apiRequest('/api/score/writing', params, options)
}

// Recitation Scoring
export async function scoreRecitation(
  params: {
    originalText: string
    transcription: string
  },
  options?: APIRequestOptions
) {
  return apiRequest('/api/score/recitation', params, options)
}

// Speech Mode Scoring
export async function scoreSpeech(
  params: {
    topic: string
    outline: unknown
    transcription: string
    durationSeconds: number
  },
  options?: APIRequestOptions
) {
  return apiRequest('/api/score/speech', params, options)
}

// Your Aura - Model Example
export async function generateAuraExample(
  params: {
    exerciseType: string
    exerciseContent: unknown
    userSubmission: string
    level: string
  },
  options?: APIRequestOptions
) {
  return apiRequest<{
    content: string
    highlights: string[]
    explanation: string
  }>('/api/aura', params, options)
}

// Search Trending Content
export async function searchContent(
  params: {
    query: string
    category: string
  },
  options?: APIRequestOptions
) {
  return apiRequest<{
    results: { title: string; url: string; snippet: string }[]
  }>('/api/search', params, options)
}

// Generate Trending Story
export async function generateStory(
  params: {
    category: string
    level: string
    trendingTopics?: string[]
  },
  options?: APIRequestOptions
) {
  return apiRequest<{
    title: string
    content: string
    trendingWords: { word: string; definition: string; pronunciation?: string; examples: string[] }[]
  }>('/api/stories', params, options)
}

// Whisper Audio Transcription (direct call to OpenAI, no backend needed)
export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<{
  text: string
  words?: { word: string; start: number; end: number }[]
}> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'word')
  formData.append('language', 'en')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    text: data.text,
    words: data.words,
  }
}

// Comprehensive Pronunciation Analysis (AI-powered)
export async function analyzePronunciationFull(
  params: {
    originalText: string
    transcription: string
    whisperWords?: { word: string; start: number; end: number }[]
    pitchData?: { averageF0: number; minF0: number; maxF0: number }
    intonationPatterns?: { pattern: string; startTime: number; endTime: number }[]
    durationSeconds: number
    wpm: number
  },
  options?: APIRequestOptions
) {
  return apiRequest<{
    wordAnalysis: {
      word: string
      expected: string
      status: 'correct' | 'mispronounced' | 'missed' | 'added'
      confidence?: number
      ipa?: string
      tip?: string
    }[]
    intonationFeedback: {
      sentenceIndex: number
      sentence: string
      expectedPattern: string
      actualPattern: string
      feedback: string
    }[]
    rhythmAnalysis: {
      wpm: number
      optimalWpmRange: [number, number]
      pauseCount: number
      longPauses: { time: number; duration: number }[]
      fillerWords: string[]
      paceVariation: number
      feedback: string
    }
    pronunciationCoaching: string
  }>('/api/analyze-pronunciation', params, options)
}

// Sync offline queue
export async function syncOfflineQueue(
  queue: { endpoint: string; payload: unknown }[],
  options?: APIRequestOptions
) {
  const results = []
  for (const item of queue) {
    try {
      const result = await apiRequest(item.endpoint, item.payload, options)
      results.push({ success: true, result })
    } catch {
      results.push({ success: false })
    }
  }
  return results
}
