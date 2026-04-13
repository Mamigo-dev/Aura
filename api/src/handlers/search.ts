import type { Env } from '../index'

export async function handleSearch(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    query: string
    category: string
    searchProvider?: 'brave' | 'newsapi' | 'perplexity' | 'google'
    apiKey?: string
  }

  const provider = body.searchProvider || 'brave'

  try {
    let results: { title: string; url: string; snippet: string; source: string }[]

    switch (provider) {
      case 'brave':
        results = await searchBrave(body.query, env, body.apiKey)
        break
      case 'newsapi':
        results = await searchNewsAPI(body.query, env, body.apiKey)
        break
      case 'perplexity':
        results = await searchPerplexity(body.query, env, body.apiKey)
        break
      case 'google':
        results = await searchGoogle(body.query, env, body.apiKey)
        break
      default:
        results = []
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Search failed: ${error}`, results: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function searchBrave(
  query: string,
  env: Env,
  clientKey?: string
): Promise<{ title: string; url: string; snippet: string; source: string }[]> {
  const apiKey = clientKey || env.BRAVE_SEARCH_API_KEY
  if (!apiKey) throw new Error('Brave Search API key not configured')

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
    }
  )

  if (!response.ok) throw new Error(`Brave API error: ${response.status}`)

  const data = (await response.json()) as {
    web?: { results: { title: string; url: string; description: string }[] }
  }

  return (data.web?.results || []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
    source: 'brave',
  }))
}

async function searchNewsAPI(
  query: string,
  env: Env,
  clientKey?: string
): Promise<{ title: string; url: string; snippet: string; source: string }[]> {
  const apiKey = clientKey || env.NEWSAPI_API_KEY
  if (!apiKey) throw new Error('NewsAPI key not configured')

  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5`,
    {
      headers: { 'X-Api-Key': apiKey },
    }
  )

  if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`)

  const data = (await response.json()) as {
    articles: { title: string; url: string; description: string }[]
  }

  return (data.articles || []).map((a) => ({
    title: a.title,
    url: a.url,
    snippet: a.description || '',
    source: 'newsapi',
  }))
}

async function searchPerplexity(
  query: string,
  env: Env,
  clientKey?: string
): Promise<{ title: string; url: string; snippet: string; source: string }[]> {
  const apiKey = clientKey || env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('Perplexity API key not configured')

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: `Search for recent information about: ${query}. Return 3-5 key findings with source URLs.`,
        },
      ],
    }),
  })

  if (!response.ok) throw new Error(`Perplexity API error: ${response.status}`)

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
    citations?: string[]
  }

  const content = data.choices[0]?.message?.content || ''
  const citations = data.citations || []

  return citations.slice(0, 5).map((url, i) => ({
    title: `Result ${i + 1}`,
    url,
    snippet: content.substring(i * 200, (i + 1) * 200),
    source: 'perplexity',
  }))
}

async function searchGoogle(
  query: string,
  env: Env,
  clientKey?: string
): Promise<{ title: string; url: string; snippet: string; source: string }[]> {
  const apiKey = clientKey || env.GOOGLE_SEARCH_API_KEY
  const cx = env.GOOGLE_SEARCH_CX
  if (!apiKey || !cx) throw new Error('Google Search API key or CX not configured')

  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`
  )

  if (!response.ok) throw new Error(`Google Search error: ${response.status}`)

  const data = (await response.json()) as {
    items?: { title: string; link: string; snippet: string }[]
  }

  return (data.items || []).map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
    source: 'google',
  }))
}
