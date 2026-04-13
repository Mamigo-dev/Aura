/**
 * AI Text-to-Speech using OpenAI TTS API
 * Falls back to browser SpeechSynthesis if no API key
 */

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer'

export const TTS_VOICES: { id: TTSVoice; label: string; description: string }[] = [
  { id: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', label: 'Echo', description: 'Warm and confident' },
  { id: 'fable', label: 'Fable', description: 'Expressive and British' },
  { id: 'nova', label: 'Nova', description: 'Friendly and energetic' },
  { id: 'onyx', label: 'Onyx', description: 'Deep and authoritative' },
  { id: 'shimmer', label: 'Shimmer', description: 'Soft and clear' },
]

export async function speakWithAI(
  text: string,
  apiKey: string,
  options: {
    voice?: TTSVoice
    speed?: number
  } = {}
): Promise<HTMLAudioElement> {
  const { voice = 'nova', speed = 1.0 } = options

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed,
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`)
  }

  const audioBlob = await response.blob()
  const audioUrl = URL.createObjectURL(audioBlob)
  const audio = new Audio(audioUrl)

  // Clean up blob URL when audio finishes
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(audioUrl)
  })

  return audio
}

/**
 * Browser fallback TTS
 */
export function speakWithBrowser(text: string, rate: number = 1.0): void {
  if (!('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.lang = 'en-US'

  // Try to find a good English voice
  const voices = window.speechSynthesis.getVoices()
  const englishVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium'))
  ) || voices.find((v) => v.lang.startsWith('en'))

  if (englishVoice) utterance.voice = englishVoice

  window.speechSynthesis.speak(utterance)
}
