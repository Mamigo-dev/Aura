import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleAura(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    exerciseType: string
    exerciseContent: unknown
    userSubmission: string
    level: string
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are generating "Your Aura" - a model example for an English learner at ${body.level} level.

Generate an aspirational but achievable model response that is one level above the user's current ability. This should:
1. Demonstrate natural, fluent English for this context
2. Use 2-3 vocabulary items or expressions the user likely doesn't know yet
3. Show the kind of response the user could produce with practice

Return JSON:
{
  "content": "the model response text",
  "highlights": ["key phrases worth learning"],
  "explanation": "brief note on what makes this response effective"
}`
      },
      {
        role: 'user',
        content: `Exercise type: ${body.exerciseType}
Exercise content: ${JSON.stringify(body.exerciseContent)}
User's attempt: "${body.userSubmission}"`
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
