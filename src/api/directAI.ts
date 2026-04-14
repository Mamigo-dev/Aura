/**
 * Direct AI API calls from the browser.
 * Used when user has their own API key — bypasses the backend entirely.
 * This is the BYOK (Bring Your Own Key) path.
 */

import type { AIProvider } from '../types/user'

interface DirectAIOptions {
  provider: AIProvider
  apiKey: string
}

/**
 * Call AI directly from browser with a system prompt + user message.
 * Returns the text response.
 */
export async function callAIDirect(
  systemPrompt: string,
  userMessage: string,
  options: DirectAIOptions
): Promise<string> {
  if (options.provider === 'claude') {
    return callClaudeDirect(systemPrompt, userMessage, options.apiKey)
  } else {
    return callGPTDirect(systemPrompt, userMessage, options.apiKey)
  }
}

async function callClaudeDirect(
  systemPrompt: string,
  userMessage: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callGPTDirect(
  systemPrompt: string,
  userMessage: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseAIJSON<T>(text: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim()
  return JSON.parse(jsonStr)
}

// ============================================================
// Pre-built prompts for direct AI scoring
// ============================================================

export async function scoreReadAloudDirect(
  params: {
    originalText: string
    transcription: string
    keyPhrases: string[]
  },
  options: DirectAIOptions
) {
  const systemPrompt = `You are an English pronunciation assessment expert. Compare the expected text with what was recognized by speech-to-text and provide detailed feedback.

Return JSON only:
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

  const userMessage = `Expected text: "${params.originalText}"
Recognized (transcribed): "${params.transcription}"
Key phrases to evaluate: ${JSON.stringify(params.keyPhrases)}`

  const response = await callAIDirect(systemPrompt, userMessage, options)
  return parseAIJSON(response)
}

export async function scoreWritingDirect(
  params: {
    prompt: string
    submission: string
    level: string
  },
  options: DirectAIOptions
) {
  const systemPrompt = `You are an English writing assessor. Score this writing submission on 5 dimensions.

SCORING RUBRIC (each 0-20 points):
- Grammar: sentence structure, tense, agreement, articles
- Vocabulary: range, appropriateness, repetition avoidance
- Coherence: logical flow, transitions, paragraph structure
- Task Fulfillment: addresses prompt fully, meets requirements, stays on-topic
- Style: tone, sentence variety, naturalness

Return JSON only:
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

  const userMessage = `PROMPT: ${params.prompt}
STUDENT LEVEL: ${params.level}
STUDENT'S WRITING:
${params.submission}`

  const response = await callAIDirect(systemPrompt, userMessage, options)
  return parseAIJSON(response)
}

export async function analyzePronunciationDirect(
  params: {
    originalText: string
    transcription: string
    whisperWords?: { word: string; start: number; end: number }[]
    pitchData?: { averageF0: number; minF0: number; maxF0: number }
    durationSeconds: number
    wpm: number
  },
  options: DirectAIOptions
) {
  const systemPrompt = `You are an expert English pronunciation coach. Compare the ORIGINAL TEXT with what was ACTUALLY TRANSCRIBED by speech recognition.

CRITICAL RULES:
- ONLY analyze words that actually appear in the original text
- Do NOT invent words or use example words that aren't in the original
- Compare word-by-word: for each word in the original, check if the transcription has a matching word
- If the transcription has a different word in that position, it's "mispronounced" (the speaker said the wrong word)
- If a word from the original doesn't appear in the transcription at all, it's "missed"
- Mark words as "correct" ONLY if they appear correctly in both original and transcription
- For mispronounced words, the "expected" field should show what the speaker actually said (the wrong word from the transcription)

Return ONLY valid JSON, no other text:
{
  "wordAnalysis": [
    {"word": "ORIGINAL_WORD", "expected": "WHAT_SPEAKER_SAID", "status": "correct|mispronounced|missed", "ipa": "/IPA_IF_MISPRONOUNCED/", "tip": "specific pronunciation tip if mispronounced"}
  ],
  "intonationFeedback": [
    {"sentenceIndex": 0, "sentence": "the actual sentence from original", "expectedPattern": "rising|falling|flat", "actualPattern": "rising|falling|flat", "feedback": "specific feedback"}
  ],
  "rhythmAnalysis": {
    "wpm": ${params.wpm},
    "optimalWpmRange": [130, 160],
    "pauseCount": 0,
    "longPauses": [],
    "fillerWords": [],
    "paceVariation": 50,
    "feedback": "specific pace feedback based on the actual WPM"
  },
  "pronunciationCoaching": "2-3 sentences of specific, actionable coaching for THIS reading"
}`

  const userMessage = `Original text: "${params.originalText}"
Transcription: "${params.transcription}"
${params.whisperWords ? `Whisper word data: ${JSON.stringify(params.whisperWords)}` : ''}
${params.pitchData ? `Pitch: avg=${params.pitchData.averageF0.toFixed(0)}Hz, range=${params.pitchData.minF0.toFixed(0)}-${params.pitchData.maxF0.toFixed(0)}Hz` : ''}
Duration: ${params.durationSeconds.toFixed(1)}s, Rate: ${params.wpm} WPM`

  const response = await callAIDirect(systemPrompt, userMessage, options)
  return parseAIJSON(response)
}
