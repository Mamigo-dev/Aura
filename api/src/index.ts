import { handleAssess } from './handlers/assess'
import { handleGenerate } from './handlers/generate'
import { handleScorePronunciation } from './handlers/score-pronunciation'
import { handleScoreWriting } from './handlers/score-writing'
import { handleScoreRecitation } from './handlers/score-recitation'
import { handleScoreSpeech } from './handlers/score-speech'
import { handleAura } from './handlers/aura'
import { handleSearch } from './handlers/search'
import { handleStories } from './handlers/stories'
import { handleAnalyzePronunciation } from './handlers/analyze-pronunciation'

export interface Env {
  ANTHROPIC_API_KEY?: string
  OPENAI_API_KEY?: string
  BRAVE_SEARCH_API_KEY?: string
  NEWSAPI_API_KEY?: string
  PERPLEXITY_API_KEY?: string
  GOOGLE_SEARCH_API_KEY?: string
  GOOGLE_SEARCH_CX?: string
  CACHE?: KVNamespace
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      let response: Response

      switch (path) {
        case '/api/assess':
          response = await handleAssess(request, env)
          break
        case '/api/generate':
          response = await handleGenerate(request, env)
          break
        case '/api/score/pronunciation':
          response = await handleScorePronunciation(request, env)
          break
        case '/api/score/writing':
          response = await handleScoreWriting(request, env)
          break
        case '/api/score/recitation':
          response = await handleScoreRecitation(request, env)
          break
        case '/api/score/speech':
          response = await handleScoreSpeech(request, env)
          break
        case '/api/aura':
          response = await handleAura(request, env)
          break
        case '/api/analyze-pronunciation':
          response = await handleAnalyzePronunciation(request, env)
          break
        case '/api/search':
          response = await handleSearch(request, env)
          break
        case '/api/stories':
          response = await handleStories(request, env)
          break
        default:
          response = new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
      }

      // Add CORS headers
      const headers = new Headers(response.headers)
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        headers.set(key, value)
      })

      return new Response(response.body, {
        status: response.status,
        headers,
      })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: String(error) }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      )
    }
  },
}
