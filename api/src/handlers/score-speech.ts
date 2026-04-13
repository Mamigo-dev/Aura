import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleScoreSpeech(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    topic: string
    outline: unknown
    transcription: string
    durationSeconds: number
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are a public speaking coach assessing a speech delivery. Evaluate the speech based on content structure, delivery quality, and overall effectiveness.

Return JSON:
{
  "delivery": 0-100,
  "structure": 0-100,
  "fillerWords": 0-100 (higher = fewer fillers = better),
  "pace": 0-100,
  "wordsPerMinute": number,
  "fillerCount": number,
  "fillerList": ["um", "like"],
  "overallFeedback": "2-3 sentences",
  "structureFeedback": "feedback on speech organization"
}`
      },
      {
        role: 'user',
        content: `Topic: ${body.topic}
Expected outline: ${JSON.stringify(body.outline)}
Transcription: "${body.transcription}"
Duration: ${body.durationSeconds} seconds`
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
