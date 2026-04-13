import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleAssess(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    answers: Record<string, string>
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are an English language assessment specialist. Analyze test responses and determine the user's CEFR level (A1-C2).

IMPORTANT CONTEXT: This user likely has strong technical/scientific vocabulary but may struggle with everyday expressions and casual conversation. Factor this asymmetry into your assessment.

Return JSON only:
{
  "level": "B1",
  "scores": {
    "vocabulary": 75,
    "grammar": 60,
    "comprehension": 70,
    "dailyExpressions": 40,
    "technicalVocab": 90,
    "idioms": 35
  },
  "weakAreas": ["daily_expressions", "idioms"],
  "recommendations": ["Focus on everyday conversation patterns", "Practice common idioms"]
}`
      },
      {
        role: 'user',
        content: `Here are the user's assessment answers:\n${JSON.stringify(body.answers, null, 2)}`
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
