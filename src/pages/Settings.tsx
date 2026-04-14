import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { clearAllData } from '../lib/db'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { Modal } from '../components/ui/Modal'
import { Header } from '../components/layout/Header'
import type { AIProvider, SearchProvider } from '../types/user'
import { getAIStatus } from '../lib/ai-status'
import { TTS_VOICES, type TTSVoice } from '../lib/tts'

const SEARCH_PROVIDERS: { id: SearchProvider; label: string }[] = [
  { id: 'brave', label: 'Brave Search' },
  { id: 'newsapi', label: 'NewsAPI' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'google', label: 'Google' },
]

const API_KEY_PROVIDERS = [
  { id: 'claude', label: 'Claude API Key' },
  { id: 'gpt', label: 'OpenAI API Key' },
  { id: 'azure', label: 'Azure Speech Key', description: 'For real phoneme-level pronunciation analysis (free 5h/month)' },
  { id: 'brave', label: 'Brave Search Key' },
  { id: 'newsapi', label: 'NewsAPI Key' },
  { id: 'perplexity', label: 'Perplexity Key' },
  { id: 'google', label: 'Google Search Key' },
]

const AZURE_REGIONS = [
  'eastus', 'westus', 'westus2', 'centralus', 'eastus2',
  'westeurope', 'northeurope', 'southeastasia', 'eastasia',
  'australiaeast', 'japaneast', 'koreacentral',
]

export default function Settings() {
  const navigate = useNavigate()
  const { profile, setAIProvider, setSearchProviders, setApiKey, updateProfile } =
    useUserStore()

  const [showClearModal, setShowClearModal] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  if (!profile) return null

  const { preferences } = profile

  const handleAIProviderChange = (provider: AIProvider) => {
    setAIProvider(provider)
  }

  const handleSearchProviderToggle = (provider: SearchProvider) => {
    const current = preferences.searchProviders
    const updated = current.includes(provider)
      ? current.filter((p) => p !== provider)
      : [...current, provider]
    setSearchProviders(updated)
  }

  const handleApiKeyChange = (provider: string, key: string) => {
    setApiKey(provider, key)
  }

  const toggleKeyVisibility = (provider: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })
  }

  const handleDailyGoalChange = (delta: number) => {
    const newGoal = Math.min(20, Math.max(1, profile.dailyGoal + delta))
    updateProfile({ dailyGoal: newGoal })
  }

  const handleSpeechRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value)
    updateProfile({
      preferences: { ...preferences, speechRate: rate },
    })
  }

  const handleNotificationsToggle = () => {
    updateProfile({
      preferences: {
        ...preferences,
        notificationsEnabled: !preferences.notificationsEnabled,
      },
    })
  }

  const handleNotificationTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({
      preferences: { ...preferences, notificationTime: e.target.value },
    })
  }

  const handleClearData = useCallback(async () => {
    try {
      await clearAllData()
      setShowClearModal(false)
      window.location.reload()
    } catch (err) {
      console.error('Failed to clear data:', err)
    }
  }, [])

  const getSpeechRateLabel = (rate: number): string => {
    if (rate <= 0.7) return 'Slow'
    if (rate <= 1.3) return 'Normal'
    return 'Fast'
  }

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
      <Header showBack title="Settings" showSettings={false} />

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* AI Connection Status */}
        {(() => {
          const status = getAIStatus(preferences)
          return (
            <Card
              variant="glass"
              padding="md"
              className={`animate-fade-in-up border-l-4 ${
                status.aiConnected ? 'border-l-aura-success' : 'border-l-aura-warning'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.aiConnected ? 'bg-aura-success animate-pulse' : 'bg-aura-warning'
                  }`}
                />
                <h3 className="font-semibold text-aura-text">
                  {status.aiConnected ? 'AI Connected' : 'AI Not Connected'}
                </h3>
              </div>
              {status.aiConnected ? (
                <div className="text-sm text-aura-text-dim space-y-1">
                  <p>
                    Using: <span className="text-aura-text font-medium">{status.activeProvider === 'claude' ? 'Claude' : 'GPT'}</span>
                    {status.activeProvider !== status.aiProvider && (
                      <span className="text-aura-gold"> (auto-detected)</span>
                    )}
                    {' '}&middot;{' '}
                    Scoring: <span className="text-aura-success font-medium">AI-Powered</span>
                    {' '}&middot;{' '}
                    Key: <span className="text-aura-text font-medium">
                      {status.keySource === 'env' ? '.env (built-in)' : 'User configured'}
                    </span>
                  </p>
                  {status.searchProvidersConnected.length > 0 && (
                    <p>
                      Search: <span className="text-aura-text font-medium">{status.searchProvidersConnected.join(', ')}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-aura-text-dim space-y-1">
                  <p>Scoring is <span className="text-aura-warning font-medium">Local Only</span> (basic word matching)</p>
                  <p>Add an API key below to enable AI-powered scoring, content generation, and Your Aura examples.</p>
                </div>
              )}
            </Card>
          )
        })()}

        {/* AI Provider */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-3">
            <GradientText>AI Provider</GradientText>
          </h3>
          <div className="flex gap-3">
            {(['claude', 'gpt'] as AIProvider[]).map((provider) => (
              <button
                key={provider}
                onClick={() => handleAIProviderChange(provider)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  preferences.aiProvider === provider
                    ? 'bg-aura-purple text-white shadow-lg shadow-aura-purple/20'
                    : 'bg-aura-surface text-aura-text-dim hover:bg-aura-surface-hi'
                }`}
              >
                {provider === 'claude' ? 'Claude' : 'GPT'}
              </button>
            ))}
          </div>
        </Card>

        {/* Search APIs */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-3">
            <GradientText>Search APIs</GradientText>
          </h3>
          <div className="space-y-2">
            {SEARCH_PROVIDERS.map((sp) => (
              <label
                key={sp.id}
                className="flex items-center justify-between py-2 cursor-pointer"
              >
                <span className="text-sm text-aura-text">{sp.label}</span>
                <div
                  className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${
                    preferences.searchProviders.includes(sp.id)
                      ? 'bg-aura-purple'
                      : 'bg-aura-surface'
                  }`}
                  onClick={() => handleSearchProviderToggle(sp.id)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      preferences.searchProviders.includes(sp.id)
                        ? 'translate-x-5'
                        : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* API Keys */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-semibold">
              <GradientText>API Keys</GradientText>
            </h3>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className={`text-aura-text-dim transition-transform duration-200 ${showApiKeys ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showApiKeys && (
            <div className="mt-4 space-y-4">
              {API_KEY_PROVIDERS.map((provider) => {
                const currentKey = preferences.apiKeys?.[provider.id as keyof typeof preferences.apiKeys] ?? ''
                const isVisible = visibleKeys.has(provider.id)

                return (
                  <div key={provider.id}>
                    <label className="block text-sm text-aura-text-dim mb-1.5">
                      {provider.label}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={currentKey}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                        placeholder={`Enter ${provider.label}`}
                        className="flex-1 bg-aura-surface border border-aura-border rounded-xl px-3 py-2 text-sm text-aura-text placeholder-aura-text-dim/40 focus:outline-none focus:border-aura-purple/50 transition-colors"
                      />
                      <button
                        onClick={() => toggleKeyVisibility(provider.id)}
                        className="w-10 h-10 rounded-xl bg-aura-surface border border-aura-border flex items-center justify-center text-aura-text-dim hover:text-aura-text transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          {isVisible ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Azure Region (show when Azure key exists) */}
        {preferences.apiKeys?.azure && (
          <Card variant="glass" padding="md" className="animate-fade-in-up">
            <h3 className="font-semibold mb-2">
              <GradientText>Azure Region</GradientText>
            </h3>
            <p className="text-xs text-aura-text-dim mb-3">
              Select the region matching your Azure Speech resource.
            </p>
            <select
              value={preferences.azureRegion || 'eastus'}
              onChange={(e) => updateProfile({
                preferences: { ...preferences, azureRegion: e.target.value },
              })}
              className="w-full bg-aura-surface border border-aura-border rounded-xl px-3 py-2 text-sm text-aura-text focus:outline-none focus:border-aura-purple/50"
            >
              {AZURE_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Card>
        )}

        {/* Daily Goal */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-3">
            <GradientText>Daily Goal</GradientText>
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-aura-text-dim">Exercises per day</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDailyGoalChange(-1)}
                disabled={profile.dailyGoal <= 1}
                className="w-8 h-8 rounded-full bg-aura-surface flex items-center justify-center text-aura-text-dim hover:text-aura-text hover:bg-aura-surface-hi disabled:opacity-30 transition-all"
              >
                -
              </button>
              <span className="text-xl font-bold text-aura-text w-8 text-center">
                {profile.dailyGoal}
              </span>
              <button
                onClick={() => handleDailyGoalChange(1)}
                disabled={profile.dailyGoal >= 20}
                className="w-8 h-8 rounded-full bg-aura-surface flex items-center justify-center text-aura-text-dim hover:text-aura-text hover:bg-aura-surface-hi disabled:opacity-30 transition-all"
              >
                +
              </button>
            </div>
          </div>
        </Card>

        {/* AI Voice Selection */}
        {preferences.apiKeys?.gpt && (
          <Card variant="glass" padding="md" className="animate-fade-in-up">
            <h3 className="font-semibold mb-3">
              <GradientText>AI Voice</GradientText>
            </h3>
            <p className="text-xs text-aura-text-dim mb-3">
              Powered by OpenAI TTS. Used for Listen buttons across the app.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TTS_VOICES.map((v) => {
                const currentVoice = preferences.ttsVoice || 'nova'
                const isSelected = currentVoice === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => updateProfile({
                      preferences: { ...preferences, ttsVoice: v.id },
                    })}
                    className={`text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                      isSelected
                        ? 'bg-aura-purple/20 border border-aura-purple text-aura-text'
                        : 'bg-aura-surface border border-aura-border text-aura-text-dim hover:border-aura-purple/30'
                    }`}
                  >
                    <span className="font-medium block">{v.label}</span>
                    <span className="text-xs opacity-70">{v.description}</span>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        {/* Speech Rate */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-3">
            <GradientText>Speech Rate</GradientText>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-aura-text-dim">
                {preferences.speechRate.toFixed(1)}x - {getSpeechRateLabel(preferences.speechRate)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={preferences.speechRate}
              onChange={handleSpeechRateChange}
              className="w-full accent-aura-purple"
            />
            <div className="relative text-xs text-aura-text-dim/60 h-4">
              <span className="absolute left-0">Slow</span>
              <span className="absolute" style={{ left: `${((1.0 - 0.5) / (2.0 - 0.5)) * 100}%`, transform: 'translateX(-50%)' }}>Normal</span>
              <span className="absolute right-0">Fast</span>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-3">
            <GradientText>Notifications</GradientText>
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-aura-text">Daily reminders</span>
              <div
                className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${
                  preferences.notificationsEnabled
                    ? 'bg-aura-purple'
                    : 'bg-aura-surface'
                }`}
                onClick={handleNotificationsToggle}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    preferences.notificationsEnabled
                      ? 'translate-x-5'
                      : 'translate-x-1'
                  }`}
                />
              </div>
            </label>

            {preferences.notificationsEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-aura-text-dim">Reminder time</span>
                <input
                  type="time"
                  value={preferences.notificationTime}
                  onChange={handleNotificationTimeChange}
                  className="bg-aura-surface border border-aura-border rounded-xl px-3 py-1.5 text-sm text-aura-text focus:outline-none focus:border-aura-purple/50 transition-colors"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in-up">
          <h3 className="font-semibold text-sm text-aura-text-dim uppercase tracking-wide">
            Actions
          </h3>

          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-text">
                  Retake Assessment
                </p>
                <p className="text-xs text-aura-text-dim mt-0.5">
                  Redo the placement test to update your level
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/onboarding')}
              >
                Retake
              </Button>
            </div>
          </Card>

          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-error">Clear All Data</p>
                <p className="text-xs text-aura-text-dim mt-0.5">
                  Delete all progress, settings, and saved exercises
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowClearModal(true)}
              >
                Clear
              </Button>
            </div>
          </Card>
        </div>

        {/* About */}
        <Card variant="glass" padding="md" className="animate-fade-in-up">
          <h3 className="font-semibold mb-2">
            <GradientText>About</GradientText>
          </h3>
          <div className="space-y-1 text-sm text-aura-text-dim">
            <p>Aura v1.0.0</p>
            <p>Built with AI</p>
          </div>
        </Card>
      </div>

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All Data?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-aura-text-dim">
            This will permanently delete all your progress, exercise results,
            settings, and saved data. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowClearModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleClearData}>
              Delete Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
