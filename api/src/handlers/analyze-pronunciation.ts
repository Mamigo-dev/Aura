import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleAnalyzePronunciation(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    originalText: string
    transcription: string
    whisperWords?: { word: string; start: number; end: number }[]
    pitchData?: { averageF0: number; minF0: number; maxF0: number }
    intonationPatterns?: { pattern: string; startTime: number; endTime: number }[]
    durationSeconds: number
    wpm: number
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are an expert English pronunciation coach. Analyze a student's reading aloud attempt comprehensively.

You will receive:
- The original text they were reading
- What was actually transcribed (from speech recognition)
- Word-level timestamps and confidence from Whisper (if available)
- Pitch/intonation data (if available)
- Speaking rate (WPM)

Provide a THOROUGH analysis covering:

1. **Word-by-word analysis**: For EVERY word in the original, determine if it was said correctly, mispronounced, or missed. For mispronounced words, provide IPA pronunciation and a specific tip.

2. **Intonation feedback**: For each sentence, note if the intonation pattern was appropriate:
   - Questions should rise at the end
   - Statements should fall
   - Lists should rise on each item except the last
   - Emphasis words should have pitch peaks

3. **Rhythm analysis**: Evaluate pacing, pauses, filler words, and variation.

4. **Overall coaching**: 2-3 paragraphs of actionable advice, prioritized by impact.

Return JSON:
{
  "wordAnalysis": [
    {"word": "the", "expected": "the", "status": "correct"},
    {"word": "algorithms", "expected": "algorithms", "status": "mispronounced", "ipa": "/ˈæl.ɡə.rɪð.əmz/", "tip": "Stress the second syllable: al-GOR-ith-ums. The 'th' is a soft /ð/ sound."}
  ],
  "intonationFeedback": [
    {"sentenceIndex": 0, "sentence": "...", "expectedPattern": "falling", "actualPattern": "flat", "feedback": "This statement should end with a falling tone to sound confident and complete."}
  ],
  "rhythmAnalysis": {
    "wpm": 142,
    "optimalWpmRange": [130, 160],
    "pauseCount": 3,
    "longPauses": [{"time": 5.2, "duration": 2.1}],
    "fillerWords": [],
    "paceVariation": 45,
    "feedback": "Your pace is good overall. Try varying your speed more — slow down slightly before key phrases for emphasis."
  },
  "pronunciationCoaching": "Overall coaching text here..."
}`
      },
      {
        role: 'user',
        content: `Original text: "${body.originalText}"

Transcription: "${body.transcription}"

${body.whisperWords ? `Whisper word-level data: ${JSON.stringify(body.whisperWords)}` : 'No Whisper data available.'}

${body.pitchData ? `Pitch data: avg F0=${body.pitchData.averageF0.toFixed(1)}Hz, range=${body.pitchData.minF0.toFixed(1)}-${body.pitchData.maxF0.toFixed(1)}Hz` : ''}

${body.intonationPatterns ? `Detected intonation patterns: ${JSON.stringify(body.intonationPatterns)}` : ''}

Duration: ${body.durationSeconds.toFixed(1)}s
Speaking rate: ${body.wpm} WPM`
      }
    ],
    env,
    body.provider,
    body.apiKey
  )

  const parsed = parseJSON(result.content)
  return new Response(JSON.stringify(parsed), {
    headers: { 'Content-Type': 'application/json' },
  })
}
