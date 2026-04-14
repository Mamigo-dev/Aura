import type { UserPreferences, AIProvider } from '../types/user'
import { API_BASE_URL, ENV_KEYS } from './constants'

export interface AIStatus {
  aiConnected: boolean
  aiProvider: AIProvider
  activeProvider: AIProvider // the provider that actually has a key
  hasApiKey: boolean
  hasBackendUrl: boolean
  keySource: 'env' | 'user' | 'none'
  availableProviders: AIProvider[] // all providers with keys
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

/**
 * Get the best available AI provider — the one that actually has a key.
 * If the selected provider has a key, use it. Otherwise, use whichever has a key.
 */
function getBestProvider(preferences: UserPreferences): { provider: AIProvider; key: string; source: 'env' | 'user' | 'none' } {
  const providers: AIProvider[] = ['claude', 'gpt']

  // First try the user's selected provider
  const selectedKey = getEffectiveKey(preferences, preferences.aiProvider)
  if (selectedKey.length > 10) {
    const userKey = preferences.apiKeys?.[preferences.aiProvider]
    return {
      provider: preferences.aiProvider,
      key: selectedKey,
      source: userKey && userKey.length > 10 ? 'user' : 'env',
    }
  }

  // If selected provider has no key, try the other one
  for (const p of providers) {
    if (p === preferences.aiProvider) continue
    const key = getEffectiveKey(preferences, p)
    if (key.length > 10) {
      const userKey = preferences.apiKeys?.[p]
      return {
        provider: p,
        key,
        source: userKey && userKey.length > 10 ? 'user' : 'env',
      }
    }
  }

  return { provider: preferences.aiProvider, key: '', source: 'none' }
}

export function getAIStatus(preferences: UserPreferences): AIStatus {
  const best = getBestProvider(preferences)
  const hasApiKey = best.key.length > 10
  const hasBackendUrl = !!API_BASE_URL && API_BASE_URL !== 'https://aura-api.workers.dev'
  const aiConnected = hasApiKey || hasBackendUrl

  const availableProviders: AIProvider[] = []
  if (getEffectiveKey(preferences, 'claude').length > 10) availableProviders.push('claude')
  if (getEffectiveKey(preferences, 'gpt').length > 10) availableProviders.push('gpt')

  const searchProvidersConnected = preferences.searchProviders.filter((sp) => {
    const key = getEffectiveKey(preferences, sp)
    return !!key && key.length > 5
  })

  return {
    aiConnected,
    aiProvider: preferences.aiProvider,
    activeProvider: best.provider,
    hasApiKey,
    hasBackendUrl,
    keySource: best.source,
    availableProviders,
    searchProvidersConnected,
  }
}

/**
 * Determines whether to use AI or local scoring.
 * Returns true if ANY AI provider has a key configured.
 */
export function shouldUseAI(preferences: UserPreferences): boolean {
  const status = getAIStatus(preferences)
  return status.aiConnected
}

/**
 * Get the best API key and provider for making an AI call.
 * Use this instead of checking preferences.aiProvider directly.
 */
export function getActiveAI(preferences: UserPreferences): { provider: AIProvider; apiKey: string } | null {
  const best = getBestProvider(preferences)
  if (best.key.length > 10) {
    return { provider: best.provider, apiKey: best.key }
  }
  return null
}
