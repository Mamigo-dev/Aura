// ============================================================
// Professional Mode Types
// ============================================================

// --- Imbalance Assessment ---

export interface ImbalanceProfile {
  technicalWriting: number      // 0-100
  academicReading: number
  casualConversation: number
  socialSmallTalk: number
  impromptuSpeaking: number
  humorSarcasm: number
  registerFlexibility: number
  culturalReferences: number
}

export type ImbalanceDimension = keyof ImbalanceProfile

export const IMBALANCE_LABELS: Record<ImbalanceDimension, string> = {
  technicalWriting: 'Technical Writing',
  academicReading: 'Academic Reading',
  casualConversation: 'Casual Conversation',
  socialSmallTalk: 'Social Small Talk',
  impromptuSpeaking: 'Impromptu Speaking',
  humorSarcasm: 'Humor & Sarcasm',
  registerFlexibility: 'Register Flexibility',
  culturalReferences: 'Cultural References',
}

export interface ImbalanceAssessment {
  completedAt: string
  profile: ImbalanceProfile
  primaryGaps: ImbalanceDimension[]
  anxietyScenes: string[]
  recommendations: string[]
}

export function createDefaultImbalanceProfile(): ImbalanceProfile {
  return {
    technicalWriting: 50,
    academicReading: 50,
    casualConversation: 50,
    socialSmallTalk: 50,
    impromptuSpeaking: 50,
    humorSarcasm: 50,
    registerFlexibility: 50,
    culturalReferences: 50,
  }
}

// --- Anxiety Tiers (Scene Categories) ---

export type AnxietyTier = 'freeze' | 'avoiding' | 'robotic' | 'daily_life' | 'confident_speaking'

export const ANXIETY_TIER_META: Record<AnxietyTier, { label: string; icon: string; description: string }> = {
  freeze: { label: 'Scenes You Freeze In', icon: '🔥', description: 'High-pressure moments where you go blank' },
  avoiding: { label: 'Things You Avoid', icon: '😰', description: 'Situations you dodge or do via text instead' },
  robotic: { label: 'Sounds Robotic', icon: '🎯', description: 'You do it, but sound stiff and overly formal' },
  daily_life: { label: 'Daily Life', icon: '💬', description: 'Everyday situations you want to handle naturally' },
  confident_speaking: { label: 'Confident Speaking', icon: '🎤', description: 'Public situations where you want to shine' },
}

// --- Pro Exercise Types ---

export type ProExerciseType =
  | 'register_downshift'
  | 'scene_simulation'
  | 'quick_react'
  | 'tone_switch'
  | 'social_survival'
  | 'writing_rewrite'

export const PRO_EXERCISE_LABELS: Record<ProExerciseType, string> = {
  register_downshift: 'Register Downshift',
  scene_simulation: 'Scene Simulation',
  quick_react: 'Quick React',
  tone_switch: 'Tone Switch',
  social_survival: 'Social Survival',
  writing_rewrite: 'Writing Rewrite',
}

export const PRO_EXERCISE_ICONS: Record<ProExerciseType, string> = {
  register_downshift: '🔄',
  scene_simulation: '🎭',
  quick_react: '⚡',
  tone_switch: '🎚️',
  social_survival: '🗣️',
  writing_rewrite: '✍️',
}

export const PRO_EXERCISE_DESCRIPTIONS: Record<ProExerciseType, string> = {
  register_downshift: 'Rewrite formal sentences in a natural, casual way',
  scene_simulation: 'Respond naturally in workplace and social scenarios',
  quick_react: 'Timed responses to surprise questions and prompts',
  tone_switch: 'Deliver the same message to different audiences',
  social_survival: 'Maintain a casual conversation with AI',
  writing_rewrite: 'Transform stiff, formal text into natural writing',
}

// --- Pro Exercise Content Types ---

export interface ProExercise {
  id: string
  type: ProExerciseType
  anxietyTier: AnxietyTier
  sceneId: string
  title: string
  description: string
  content: ProExerciseContent
  passingScore: number
  createdAt: string
}

export type ProExerciseContent =
  | RegisterDownshiftContent
  | SceneSimulationContent
  | QuickReactContent
  | ToneSwitchContent
  | SocialSurvivalContent
  | WritingRewriteContent

export interface RegisterDownshiftContent {
  type: 'register_downshift'
  formalSentence: string
  context: string
  mode: 'rewrite' | 'pick_register'
  registerOptions?: { formal: string; natural: string; casual: string }
}

export interface SceneSimulationContent {
  type: 'scene_simulation'
  scenarioTitle: string
  scenarioDescription: string
  setting: string
  role: string
  initialPrompt: string
  responseMode: 'speech' | 'text' | 'both'
  expectedRegister: 'professional_natural' | 'casual' | 'super_informal'
}

export interface QuickReactContent {
  type: 'quick_react'
  prompts: { text: string; context: string }[]
  timePerPrompt: number
}

export interface ToneSwitchContent {
  type: 'tone_switch'
  baseMessage: string
  context: string
  audiences: { label: string; description: string; expectedRegister: string }[]
}

export interface SocialSurvivalContent {
  type: 'social_survival'
  scenario: string
  aiRole: string
  conversationStarters: string[]
  challenges: string[]
  durationSeconds: number
}

export interface WritingRewriteContent {
  type: 'writing_rewrite'
  originalText: string
  sourceContext: string
  targetRegister: 'natural' | 'casual' | 'friendly'
  problemDescription: string
}

// --- Naturalness Scoring ---

export interface NaturalnessScore {
  naturalness: number      // 0-100
  registerMatch: number    // 0-100
  culturalFit: number      // 0-100
  conciseness: number      // 0-100
  responseSpeed?: number   // 0-100
  flow?: number            // 0-100
}

export function calculateNaturalnessComposite(scores: NaturalnessScore): number {
  const speed = scores.responseSpeed ?? scores.flow ?? 70
  return Math.round(
    scores.naturalness * 0.35 +
    scores.registerMatch * 0.25 +
    scores.culturalFit * 0.15 +
    scores.conciseness * 0.15 +
    speed * 0.10
  )
}

// --- Pro Exercise Results ---

export interface ProExerciseResult {
  id: string
  exerciseId: string
  userId: string
  completedAt: string
  score: number
  passed: boolean
  timeSpentSeconds: number
  scores: NaturalnessScore
  feedback: string
  aura?: MultiRegisterAura
  details: ProScoringDetails
}

export type ProScoringDetails =
  | { type: 'register_downshift'; userResponse: string }
  | { type: 'scene_simulation'; transcription: string; situationAppropriateness: number }
  | { type: 'quick_react'; responses: { prompt: string; response: string; reactionTimeMs: number }[]; averageReactionTimeMs: number }
  | { type: 'tone_switch'; audienceResponses: { audience: string; response: string; registerMatchScore: number }[]; registerSpread: number }
  | { type: 'social_survival'; conversationLog: { role: 'user' | 'ai'; text: string }[]; flowMaintenance: number }
  | { type: 'writing_rewrite'; rewrittenText: string }

// --- Multi-Register Aura ---

export interface MultiRegisterAura {
  professional: { content: string; highlights: string[] }
  casual: { content: string; highlights: string[] }
  superInformal: { content: string; highlights: string[] }
  explanation: string
}
