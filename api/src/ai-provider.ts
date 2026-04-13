import type { Env } from './index'

export type AIProvider = 'claude' | 'gpt'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
}

export async function callAI(
  messages: AIMessage[],
  env: Env,
  provider: AIProvider = 'claude',
  clientApiKey?: string
): Promise<AIResponse> {
  if (provider === 'claude') {
    return callClaude(messages, env, clientApiKey)
  } else {
    return callGPT(messages, env, clientApiKey)
  }
}

async function callClaude(
  messages: AIMessage[],
  env: Env,
  clientApiKey?: string
): Promise<AIResponse> {
  const apiKey = clientApiKey || env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const systemMessage = messages.find((m) => m.role === 'system')
  const nonSystemMessages = messages.filter((m) => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemMessage?.content || '',
      messages: nonSystemMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[]
  }
  return { content: data.content[0].text }
}

async function callGPT(
  messages: AIMessage[],
  env: Env,
  clientApiKey?: string
): Promise<AIResponse> {
  const apiKey = clientApiKey || env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
  }
  return { content: data.choices[0].message.content }
}

export function parseJSON<T>(text: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
  return JSON.parse(jsonStr)
}
