import { useState, useCallback, useEffect, useRef } from 'react'

interface UseSpeechSynthesisOptions {
  rate?: number
  pitch?: number
  volume?: number
  language?: string
  voice?: string
}

interface UseSpeechSynthesisReturn {
  isSupported: boolean
  isSpeaking: boolean
  voices: SpeechSynthesisVoice[]
  speak: (text: string) => void
  cancel: () => void
  pause: () => void
  resume: () => void
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const {
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    language = 'en-US',
    voice: voiceName,
  } = options

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [isSupported])

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (voiceName) {
      const match = voices.find((v) => v.name === voiceName)
      if (match) return match
    }
    // Prefer English voices
    const englishVoices = voices.filter((v) => v.lang.startsWith('en'))
    // Prefer natural/high-quality voices
    const preferred = englishVoices.find(
      (v) => v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced')
    )
    return preferred || englishVoices[0] || null
  }, [voices, voiceName])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume
      utterance.lang = language

      const selectedVoice = getVoice()
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isSupported, rate, pitch, volume, language, getVoice]
  )

  const cancel = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const pause = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.pause()
  }, [isSupported])

  const resume = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.resume()
  }, [isSupported])

  // Cleanup
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  return {
    isSupported,
    isSpeaking,
    voices,
    speak,
    cancel,
    pause,
    resume,
  }
}
