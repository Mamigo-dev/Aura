import { useState, useCallback, useRef } from 'react'
import { useUserStore } from '../../stores/userStore'
import { shouldUseAI } from '../../lib/ai-status'
import { speakWithAI, speakWithBrowser, type TTSVoice } from '../../lib/tts'
import { Button } from '../ui/Button'

interface ListenButtonProps {
  text: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  voice?: TTSVoice
}

export function ListenButton({ text, size = 'sm', className = '', voice }: ListenButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const profile = useUserStore((s) => s.profile)
  const useAI = profile ? shouldUseAI(profile.preferences) : false
  const openaiKey = profile?.preferences.apiKeys?.gpt

  const handleListen = useCallback(async () => {
    if (isPlaying) {
      // Stop
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      window.speechSynthesis?.cancel()
      setIsPlaying(false)
      return
    }

    if (useAI && openaiKey) {
      // Use OpenAI TTS
      setIsLoading(true)
      try {
        const audio = await speakWithAI(text, openaiKey, {
          voice: voice || (profile?.preferences.ttsVoice as TTSVoice) || 'nova',
          speed: profile?.preferences.speechRate || 1.0,
        })
        audioRef.current = audio
        setIsPlaying(true)
        setIsLoading(false)

        audio.addEventListener('ended', () => {
          setIsPlaying(false)
          audioRef.current = null
        })

        await audio.play()
      } catch (err) {
        console.warn('AI TTS failed, falling back to browser:', err)
        setIsLoading(false)
        speakWithBrowser(text, profile?.preferences.speechRate || 1.0)
        setIsPlaying(true)
        // Browser TTS doesn't have a reliable end event from here, set timeout
        const estimatedDuration = (text.split(/\s+/).length / 2.5) * 1000
        setTimeout(() => setIsPlaying(false), estimatedDuration)
      }
    } else {
      // Browser TTS fallback
      speakWithBrowser(text, profile?.preferences.speechRate || 1.0)
      setIsPlaying(true)
      const estimatedDuration = (text.split(/\s+/).length / 2.5) * 1000
      setTimeout(() => setIsPlaying(false), estimatedDuration)
    }
  }, [isPlaying, useAI, openaiKey, text, voice, profile])

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={handleListen}
      loading={isLoading}
      className={className}
      icon={
        isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )
      }
    >
      {isPlaying ? 'Stop' : isLoading ? 'Loading...' : useAI && openaiKey ? 'Listen (AI)' : 'Listen'}
    </Button>
  )
}
