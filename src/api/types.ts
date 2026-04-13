export interface AssessmentRequest {
  answers: Record<string, string>
  provider?: string
}

export interface AssessmentResponse {
  level: string
  scores: {
    vocabulary: number
    grammar: number
    comprehension: number
    dailyExpressions: number
    technicalVocab: number
    idioms: number
  }
  weakAreas: string[]
  recommendations: string[]
}

export interface GenerateExerciseRequest {
  type: string
  level: string
  categoryPath: [string, string, string]
  topic?: string
  provider?: string
}

export interface SearchContentRequest {
  query: string
  category: string
  searchProvider?: string
}

export interface SearchContentResponse {
  results: {
    title: string
    url: string
    snippet: string
    source: string
  }[]
}

export interface StoryRequest {
  category: string
  level: string
  trendingTopics?: string[]
  provider?: string
}

export interface StoryResponse {
  title: string
  content: string
  trendingWords: {
    word: string
    definition: string
    pronunciation?: string
    examples: string[]
  }[]
}
