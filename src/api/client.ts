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
