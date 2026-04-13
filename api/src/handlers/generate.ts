import type { Env } from '../index'
import { callAI, parseJSON } from '../ai-provider'

export async function handleGenerate(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    type: string
    level: string
    categoryPath: [string, string, string]
    topic?: string
    provider?: 'claude' | 'gpt'
    apiKey?: string
  }

  const typePrompts: Record<string, string> = {
    read_aloud: `Generate a read-aloud passage (150-250 words) with:
- passage: the text to read
- keyPhrases: 3-5 phrases that are commonly mispronounced or important
- phoneticsHints: IPA for difficult words
- difficulty: description`,

    reading_comprehension: `Generate a reading passage (200-400 words) with 3-4 comprehension questions:
- passage: the text
- questions: array of {id, question, options (4), correctIndex, explanation}`,

    recitation: `Generate a passage for memorization (80-150 words) with:
- passage: the text to memorize
- hints: first 2-3 words of each sentence
- keyVocabulary: 3-5 items with {word, definition, example}`,

    writing: `Generate a writing prompt with:
- prompt: the writing task
- context: background information
- minWords: minimum word count
- maxWords: maximum word count
- rubric: scoring criteria for grammar, vocabulary, coherence, taskFulfillment, style`,

    speech_mode: `Generate a speech/presentation topic with:
- topic: the speech topic
- outline: {introduction, bodyPoints (3), conclusion, suggestedTransitions (3-4)}
- prepTime: prep time in seconds (30-60)
- speechTime: target speech time in seconds (120)
- isImpromptu: boolean
- tips: 3-4 delivery tips`,
  }

  const result = await callAI(
    [
      {
        role: 'system',
        content: `You are an English learning content generator. Create engaging, level-appropriate exercises.

The learner is a Chinese-speaking professional who knows technical vocabulary well but struggles with daily expressions, idioms, and natural speech patterns.

Exercise type: ${body.type}
Level: ${body.level} (CEFR)
Category: ${body.categoryPath.join(' > ')}
${body.topic ? `Topic hint: ${body.topic}` : ''}

${typePrompts[body.type] || 'Generate appropriate exercise content.'}

Return JSON with type: "${body.type}" and the fields above. Include an id (UUID), title, and description.`
      },
      {
        role: 'user',
        content: `Generate a ${body.type} exercise for level ${body.level} in category ${body.categoryPath.join(' > ')}${body.topic ? ` about: ${body.topic}` : ''}`
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
