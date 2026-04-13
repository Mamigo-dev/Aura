import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleScoreRecitation(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    originalText: string
    transcription: string
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are assessing a student's recitation from memory. Compare their recitation with the original text.

Return JSON:
{
  "completeness": 0-100,
  "accuracy": 0-100,
  "fluency": 0-100,
  "missedSentences": ["sentences that were skipped or significantly wrong"],
  "overallFeedback": "2-3 sentences of constructive feedback"
}`
      },
      {
        role: 'user',
        content: `Original text: "${body.originalText}"
Student's recitation: "${body.transcription}"`
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
