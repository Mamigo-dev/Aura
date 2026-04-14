import type { UserPreferences, AIProvider } from '../types/user'
import { API_BASE_URL, ENV_KEYS } from './constants'

export interface AIStatus {
  aiConnected: boolean
  aiProvider: AIProvider
  hasApiKey: boolean
  hasBackendUrl: boolean
  keySource: 'env' | 'user' | 'none'
  searchProvidersConnected: string[]
}

/**
 * Get the effective API key for a provider.
 * Priority: user-entered key > .env key
 */
export function getEffectiveKey(preferences: UserPreferences, provider: string): string {
  const userKey = preferences.apiKeys?.[provider as keyof typeof preferences.apiKeys]
  if (userKey && userKey.length > 5) return userKey
  return ENV_KEYS[provider] || ''
}

export function getAIStatus(preferences: UserPreferences): AIStatus {
  const aiProvider = preferences.aiProvider
  const effectiveKey = getEffectiveKey(preferences, aiProvider)
  const userKey = preferences.apiKeys?.[aiProvider]
  const hasApiKey = !!effectiveKey && effectiveKey.length > 10
  const hasBackendUrl = !!API_BASE_URL && API_BASE_URL !== 'https://aura-api.workers.dev'

  let keySource: 'env' | 'user' | 'none' = 'none'
  if (userKey && userKey.length > 10) keySource = 'user'
  else if (ENV_KEYS[aiProvider] && ENV_KEYS[aiProvider].length > 10) keySource = 'env'

  const aiConnected = hasApiKey || hasBackendUrl

  const searchProvidersConnected = preferences.searchProviders.filter((sp) => {
    const key = getEffectiveKey(preferences, sp)
    return !!key && key.length > 5
  })

  return {
    aiConnected,
    aiProvider,
    hasApiKey,
    hasBackendUrl,
    keySource,
    searchProvidersConnected,
  }
}

/**
 * Determines whether to use AI or local scoring
 */
export function shouldUseAI(preferences: UserPreferences): boolean {
  const status = getAIStatus(preferences)
  return status.aiConnected
}
