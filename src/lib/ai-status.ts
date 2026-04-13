import type { UserPreferences, AIProvider } from '../types/user'
import { API_BASE_URL } from './constants'

export interface AIStatus {
  aiConnected: boolean
  aiProvider: AIProvider
  hasApiKey: boolean
  hasBackendUrl: boolean
  searchProvidersConnected: string[]
}

export function getAIStatus(preferences: UserPreferences): AIStatus {
  const aiProvider = preferences.aiProvider
  const aiKey = preferences.apiKeys?.[aiProvider]
  const hasApiKey = !!aiKey && aiKey.length > 10
  const hasBackendUrl = !!API_BASE_URL && API_BASE_URL !== 'https://aura-api.workers.dev'

  // AI is connected if we have a key (client-side) or a backend URL (server-side keys)
  const aiConnected = hasApiKey || hasBackendUrl

  const searchProvidersConnected = preferences.searchProviders.filter((sp) => {
    const key = preferences.apiKeys?.[sp]
    return !!key && key.length > 5
  })

  return {
    aiConnected,
    aiProvider,
    hasApiKey,
    hasBackendUrl,
    searchProvidersConnected,
  }
}

export async function testAIConnection(
  preferences: UserPreferences
): Promise<{ success: boolean; message: string }> {
  try {
    const apiKey = preferences.apiKeys?.[preferences.aiProvider]
    if (!apiKey) {
      return { success: false, message: 'No API key configured' }
    }

    // Quick test: just check if the key format looks valid
    if (preferences.aiProvider === 'claude' && !apiKey.startsWith('sk-ant-')) {
      return { success: false, message: 'Invalid Claude API key format (should start with sk-ant-)' }
    }
    if (preferences.aiProvider === 'gpt' && !apiKey.startsWith('sk-')) {
      return { success: false, message: 'Invalid OpenAI API key format (should start with sk-)' }
    }

    return { success: true, message: `${preferences.aiProvider === 'claude' ? 'Claude' : 'GPT'} API key configured` }
  } catch {
    return { success: false, message: 'Connection test failed' }
  }
}

/**
 * Determines whether to use AI or local scoring for a given exercise
 */
export function shouldUseAI(preferences: UserPreferences): boolean {
  const status = getAIStatus(preferences)
  return status.aiConnected
}
