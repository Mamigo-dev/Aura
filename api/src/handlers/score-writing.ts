import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleScoreWriting(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    prompt: string
    submission: string
    level: string
    rubric: unknown
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are an English writing assessor. Score this writing submission on 5 dimensions.

SCORING RUBRIC (each 0-20 points):
- Grammar: sentence structure, tense, agreement, articles
- Vocabulary: range, appropriateness, repetition avoidance
- Coherence: logical flow, transitions, paragraph structure
- Task Fulfillment: addresses prompt fully, meets requirements, stays on-topic
- Style: tone, sentence variety, naturalness

Be encouraging but honest. Focus feedback on patterns the learner can improve.

Return JSON:
{
  "grammar": 0-20,
  "vocabulary": 0-20,
  "coherence": 0-20,
  "taskFulfillment": 0-20,
  "style": 0-20,
  "wordCount": number,
  "overallFeedback": "2-3 sentences",
  "sentenceFeedback": [
    {"sentence": "original", "feedback": "what's wrong", "improved": "better version"}
  ]
}`
      },
      {
        role: 'user',
        content: `PROMPT: ${body.prompt}
STUDENT LEVEL: ${body.level}
STUDENT'S WRITING:
${body.submission}`
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
