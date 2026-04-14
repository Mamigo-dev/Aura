/**
 * Client-side pitch (F0) extraction using Web Audio API.
 * Uses autocorrelation to detect fundamental frequency over time.
 */

export interface PitchPoint {
  time: number      // seconds from start
  frequency: number // Hz (0 if unvoiced/silent)
}

export interface PitchContourData {
  points: PitchPoint[]
  averageF0: number
  minF0: number
  maxF0: number
  durationSeconds: number
}

export interface IntonationPattern {
  startTime: number
  endTime: number
  pattern: 'rising' | 'falling' | 'flat' | 'rise-fall' | 'fall-rise'
  strength: number // 0-100
}

/**
 * Extract pitch contour from an audio blob
 */
export async function analyzePitch(audioBlob: Blob): Promise<PitchContourData> {
  const audioContext = new AudioContext()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const channelData = audioBuffer.getChannelData(0) // mono
  const sampleRate = audioBuffer.sampleRate
  const frameSize = 2048
  const hopSize = 512 // analyze every ~11ms at 44100Hz

  const points: PitchPoint[] = []
  let validFreqs: number[] = []

  for (let i = 0; i + frameSize < channelData.length; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize)
    const frequency = detectPitchACF(frame, sampleRate)
    const time = i / sampleRate

    points.push({ time, frequency })
    if (frequency > 0) validFreqs.push(frequency)
  }

  await audioContext.close()

  return {
    points,
    averageF0: validFreqs.length > 0 ? validFreqs.reduce((a, b) => a + b, 0) / validFreqs.length : 0,
    minF0: validFreqs.length > 0 ? Math.min(...validFreqs) : 0,
    maxF0: validFreqs.length > 0 ? Math.max(...validFreqs) : 0,
    durationSeconds: audioBuffer.duration,
  }
}

/**
 * Detect pitch using autocorrelation function (ACF)
 */
function detectPitchACF(frame: Float32Array, sampleRate: number): number {
  const SIZE = frame.length
  const MIN_FREQ = 80   // Hz - lowest expected pitch
  const MAX_FREQ = 400  // Hz - highest expected pitch

  // Check if frame has enough energy (avoid silence)
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += frame[i] * frame[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) return 0 // too quiet

  const minLag = Math.floor(sampleRate / MAX_FREQ)
  const maxLag = Math.floor(sampleRate / MIN_FREQ)

  let bestCorrelation = 0
  let bestLag = 0

  for (let lag = minLag; lag <= maxLag && lag < SIZE; lag++) {
    let correlation = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < SIZE - lag; i++) {
      correlation += frame[i] * frame[i + lag]
      norm1 += frame[i] * frame[i]
      norm2 += frame[i + lag] * frame[i + lag]
    }

    const normalizedCorrelation = correlation / (Math.sqrt(norm1 * norm2) + 1e-10)

    if (normalizedCorrelation > bestCorrelation) {
      bestCorrelation = normalizedCorrelation
      bestLag = lag
    }
  }

  if (bestCorrelation < 0.3 || bestLag === 0) return 0 // not confident enough

  return sampleRate / bestLag
}

/**
 * Detect intonation patterns from pitch contour
 */
export function detectIntonationPatterns(
  contour: PitchContourData,
  sentenceBoundaries: number[] // timestamps of sentence endings
): IntonationPattern[] {
  const patterns: IntonationPattern[] = []
  const voicedPoints = contour.points.filter((p) => p.frequency > 0)

  if (voicedPoints.length === 0) return patterns

  let sentenceStart = 0
  for (const boundary of sentenceBoundaries) {
    const sentencePoints = voicedPoints.filter(
      (p) => p.time >= sentenceStart && p.time <= boundary
    )

    if (sentencePoints.length >= 3) {
      const firstThird = sentencePoints.slice(0, Math.floor(sentencePoints.length / 3))
      const lastThird = sentencePoints.slice(Math.floor((sentencePoints.length * 2) / 3))

      const startAvg = firstThird.reduce((a, b) => a + b.frequency, 0) / firstThird.length
      const endAvg = lastThird.reduce((a, b) => a + b.frequency, 0) / lastThird.length

      const diff = endAvg - startAvg
      const range = contour.maxF0 - contour.minF0 || 1
      const normalizedDiff = diff / range

      let pattern: IntonationPattern['pattern']
      if (normalizedDiff > 0.15) pattern = 'rising'
      else if (normalizedDiff < -0.15) pattern = 'falling'
      else pattern = 'flat'

      patterns.push({
        startTime: sentenceStart,
        endTime: boundary,
        pattern,
        strength: Math.abs(normalizedDiff) * 100,
      })
    }

    sentenceStart = boundary
  }

  return patterns
}

/**
 * Smooth pitch contour for visualization (remove micro-fluctuations)
 */
export function smoothPitchContour(points: PitchPoint[], windowSize: number = 5): PitchPoint[] {
  return points.map((point, i) => {
    if (point.frequency === 0) return point

    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(points.length, i + Math.floor(windowSize / 2) + 1)
    const neighbors = points.slice(start, end).filter((p) => p.frequency > 0)

    if (neighbors.length === 0) return point

    const avgFreq = neighbors.reduce((a, b) => a + b.frequency, 0) / neighbors.length
    return { time: point.time, frequency: avgFreq }
  })
}
