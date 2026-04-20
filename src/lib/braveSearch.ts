/**
 * Brave Search API client — direct browser calls.
 * Free tier: 2000 queries/month.
 * Docs: https://api.search.brave.com/app/documentation/web-search/get-started
 */

export interface BraveResult {
  title: string
  url: string
  description: string
}

export async function searchBrave(
  query: string,
  apiKey: string,
  count: number = 5
): Promise<BraveResult[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Brave Search error: ${response.status}`)
  }

  const data = await response.json() as {
    web?: { results: { title: string; url: string; description: string }[] }
  }

  return (data.web?.results || []).map(r => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }))
}

/**
 * Fetch trending content for a category, then use AI to turn it into
 * a reading passage with trending vocabulary highlighted.
 */
export interface GeneratedStory {
  title: string
  category: string
  content: string
  trendingWords: {
    word: string
    definition: string
    pronunciation: string
    examples: [string, string]
  }[]
  sources: { title: string; url: string }[]
}

export async function generateStoryFromBrave(
  category: string,
  query: string,
  braveKey: string,
  aiCall: (systemPrompt: string, userMessage: string) => Promise<string>,
  parseJSON: <T>(s: string) => T
): Promise<GeneratedStory> {
  // Step 1: Fetch real trending articles from Brave
  const results = await searchBrave(query, braveKey, 5)

  if (results.length === 0) {
    throw new Error('No search results found')
  }

  // Step 2: Feed snippets to AI to generate a reading story
  const sourceText = results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.description}`)
    .join('\n\n')

  const systemPrompt = `You are a content writer creating engaging English reading material for language learners.

Given recent web search results, write an original 250-350 word reading passage that:
1. Synthesizes the trending topic naturally (do NOT copy text directly from sources)
2. Uses 3-5 trending/current vocabulary words or phrases that learners should know
3. Flows as a coherent, engaging narrative (not a news report)
4. Uses clear but sophisticated English (appropriate for B2-C1 learners)
5. Includes specific examples and concrete details

Also provide definitions and pronunciation for the trending words.

Return ONLY valid JSON:
{
  "title": "An engaging title",
  "content": "The full 250-350 word passage. Use trending words naturally throughout.",
  "trendingWords": [
    {
      "word": "the trending word or phrase",
      "definition": "Clear definition suitable for learners",
      "pronunciation": "/IPA/",
      "examples": ["Example sentence 1", "Example sentence 2"]
    }
  ]
}`

  const userMessage = `Category: ${category}
Topic query: ${query}

Recent web results about this topic:
${sourceText}

Create an original reading passage based on this trending topic.`

  const response = await aiCall(systemPrompt, userMessage)
  const parsed = parseJSON<{
    title: string
    content: string
    trendingWords: { word: string; definition: string; pronunciation: string; examples: [string, string] }[]
  }>(response)

  return {
    title: parsed.title,
    category,
    content: parsed.content,
    trendingWords: parsed.trendingWords,
    sources: results.slice(0, 3).map(r => ({ title: r.title, url: r.url })),
  }
}
