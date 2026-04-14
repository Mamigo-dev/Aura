/**
 * Azure Speech Pronunciation Assessment API integration.
 * Sends audio to Azure and gets phoneme-level pronunciation scores.
 *
 * Free tier: 5 hours/month (~600 x 30-second assessments)
 * Paid: $1.32/hour (~$0.01 per 30-second assessment)
 */

export interface AzurePronunciationConfig {
  subscriptionKey: string
  region: string // e.g. 'eastus', 'westus'
}

export interface AzureWordResult {
  word: string
  accuracyScore: number  // 0-100
  errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation'
  offsetMs: number   // start time in milliseconds
  durationMs: number // duration in milliseconds
  feedback?: {
    prosody?: {
      break?: { errorTypes: string[] }
      intonation?: { errorTypes: string[]; monotone?: { confidence: number } }
    }
  }
}

export interface AzurePronunciationResult {
  recognitionStatus: string
  displayText: string
  accuracyScore: number       // 0-100
  fluencyScore: number        // 0-100
  prosodyScore: number        // 0-100
  completenessScore: number   // 0-100
  pronunciationScore: number  // 0-100 overall
  words: AzureWordResult[]
}

/**
 * Convert audio blob to WAV PCM 16kHz mono (required by Azure)
 */
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext({ sampleRate: 16000 })
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // Get mono channel data
  const channelData = audioBuffer.getChannelData(0)

  // Resample to 16kHz if needed
  let samples: Float32Array
  if (audioBuffer.sampleRate !== 16000) {
    const ratio = audioBuffer.sampleRate / 16000
    const newLength = Math.floor(channelData.length / ratio)
    samples = new Float32Array(newLength)
    for (let i = 0; i < newLength; i++) {
      samples[i] = channelData[Math.floor(i * ratio)]
    }
  } else {
    samples = channelData
  }

  // Convert to 16-bit PCM
  const pcmData = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }

  // Build WAV file
  const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2)
  const view = new DataView(wavBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + pcmData.length * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)         // chunk size
  view.setUint16(20, 1, true)          // PCM format
  view.setUint16(22, 1, true)          // mono
  view.setUint32(24, 16000, true)      // sample rate
  view.setUint32(28, 32000, true)      // byte rate
  view.setUint16(32, 2, true)          // block align
  view.setUint16(34, 16, true)         // bits per sample
  writeString(view, 36, 'data')
  view.setUint32(40, pcmData.length * 2, true)

  // Write PCM data
  const offset = 44
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(offset + i * 2, pcmData[i], true)
  }

  await audioContext.close()
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

/**
 * Call Azure Pronunciation Assessment API
 */
export async function assessPronunciation(
  audioBlob: Blob,
  referenceText: string,
  config: AzurePronunciationConfig
): Promise<AzurePronunciationResult> {
  // Convert to WAV format (Azure requires WAV PCM or OGG OPUS)
  const wavBlob = await convertToWav(audioBlob)

  // Build pronunciation assessment header (base64 encoded JSON)
  const pronAssessmentParams = {
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: 'True',
    EnableProsodyAssessment: 'True',
  }
  const pronAssessmentHeader = btoa(
    unescape(encodeURIComponent(JSON.stringify(pronAssessmentParams)))
  )

  const endpoint = `https://${config.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Pronunciation-Assessment': pronAssessmentHeader,
      Accept: 'application/json',
    },
    body: wavBlob,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Azure Pronunciation Assessment error ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  if (data.RecognitionStatus !== 'Success') {
    throw new Error(`Recognition failed: ${data.RecognitionStatus}`)
  }

  const nbest = data.NBest?.[0]
  if (!nbest) {
    throw new Error('No recognition results')
  }

  return {
    recognitionStatus: data.RecognitionStatus,
    displayText: data.DisplayText || nbest.Display,
    accuracyScore: nbest.AccuracyScore ?? 0,
    fluencyScore: nbest.FluencyScore ?? 0,
    prosodyScore: nbest.ProsodyScore ?? 0,
    completenessScore: nbest.CompletenessScore ?? 0,
    pronunciationScore: nbest.PronScore ?? 0,
    words: (nbest.Words || []).map((w: {
      Word: string
      Offset: number
      Duration: number
      AccuracyScore: number
      ErrorType: string
      Feedback?: {
        Prosody?: {
          Break?: { ErrorTypes: string[] }
          Intonation?: { ErrorTypes: string[]; Monotone?: { Confidence: number } }
        }
      }
    }) => ({
      word: w.Word,
      accuracyScore: w.AccuracyScore ?? 0,
      errorType: w.ErrorType || 'None',
      offsetMs: (w.Offset || 0) / 10000, // Azure uses 100-nanosecond units → ms
      durationMs: (w.Duration || 0) / 10000,
      feedback: w.Feedback ? {
        prosody: w.Feedback.Prosody ? {
          break: w.Feedback.Prosody.Break ? {
            errorTypes: w.Feedback.Prosody.Break.ErrorTypes || [],
          } : undefined,
          intonation: w.Feedback.Prosody.Intonation ? {
            errorTypes: w.Feedback.Prosody.Intonation.ErrorTypes || [],
            monotone: w.Feedback.Prosody.Intonation.Monotone ? {
              confidence: w.Feedback.Prosody.Intonation.Monotone.Confidence,
            } : undefined,
          } : undefined,
        } : undefined,
      } : undefined,
    })),
  }
}
