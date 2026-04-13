import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleStories(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    category: string
    level: string
    trendingTopics?: string[]
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are a creative English language story writer. Generate short stories (200-400 words) that naturally weave in trending vocabulary and expressions.

The reader is a ${body.level}-level English learner who is a Chinese-speaking professional with strong technical vocabulary but weak daily expression skills.

Requirements:
- Story should be engaging and current-feeling
- Naturally incorporate 3-5 trending words/phrases
- Use vocabulary appropriate for the level but stretch slightly
- Include both technical and daily-life language bridges
- Make the story feel like something from a modern blog or magazine

Return JSON:
{
  "title": "Story Title",
  "content": "The full story text with trending words used naturally...",
  "trendingWords": [
    {
      "word": "trending term",
      "definition": "what it means",
      "pronunciation": "/IPA/",
      "examples": ["example sentence 1", "example sentence 2"]
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Generate a story for category: ${body.category}
Level: ${body.level}
${body.trendingTopics ? `Trending topics to incorporate: ${body.trendingTopics.join(', ')}` : 'Use current trending topics in this category'}`
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
