import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleScorePronunciation(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    originalText: string
    transcription: string
    keyPhrases: string[]
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are an English pronunciation assessment expert. Compare the expected text with what was recognized by speech-to-text and provide detailed feedback.

Return JSON:
{
  "accuracy": 0-100,
  "fluency": 0-100,
  "pronunciation": 0-100,
  "missedWords": ["word1", "word2"],
  "mispronounced": [
    {"word": "algorithm", "said": "algrithm", "expected": "algorithm", "tip": "Emphasize the second syllable: AL-guh-rith-um"}
  ],
  "overallFeedback": "2-3 sentences of constructive feedback"
}`
      },
      {
        role: 'user',
        content: `Expected text: "${body.originalText}"
Recognized (transcribed): "${body.transcription}"
Key phrases to evaluate: ${JSON.stringify(body.keyPhrases)}`
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
