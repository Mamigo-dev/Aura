import { create } from 'zustand'
import type { UserProfile, LevelAssessment, DailyProgress, AIProvider, SearchProvider, UserMode } from '../types/user'
import type { ImbalanceAssessment } from '../types/professional'
import { createDefaultProfile } from '../types/user'
import { saveUserProfile, getUserProfile, saveDailyProgress, getDailyProgress } from '../lib/db'

interface UserState {
  profile: UserProfile | null
  isLoading: boolean
  isOnboarded: boolean
  todayProgress: DailyProgress | null

  // Actions
  loadProfile: () => Promise<void>
  createProfile: () => Promise<UserProfile>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  setMode: (mode: UserMode) => Promise<void>
  setLevel: (assessment: LevelAssessment) => Promise<void>
  setImbalanceAssessment: (assessment: ImbalanceAssessment) => Promise<void>
  setSelectedCategories: (categories: string[]) => Promise<void>
  setSelectedScenes: (scenes: string[]) => Promise<void>
  setAIProvider: (provider: AIProvider) => Promise<void>
  setSearchProviders: (providers: SearchProvider[]) => Promise<void>
  setApiKey: (provider: string, key: string) => Promise<void>
  incrementStreak: () => Promise<void>
  resetStreak: () => Promise<void>
  completeExercise: (score: number, type: string) => Promise<void>
  loadTodayProgress: () => Promise<void>
}

const getToday = () => new Date().toISOString().split('T')[0]

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: true,
  isOnboarded: false,
  todayProgress: null,

  loadProfile: async () => {
    set({ isLoading: true })
    const profile = await getUserProfile()
    const onboarded = profile
      ? profile.userMode === 'professional'
        ? !!profile.imbalanceAssessment
        : !!profile.assessment
      : false
    set({
      profile: profile || null,
      isOnboarded: onboarded,
      isLoading: false,
    })
    if (profile) {
      await get().loadTodayProgress()
    }
  },

  createProfile: async () => {
    const profile = createDefaultProfile()
    await saveUserProfile(profile)
    set({ profile })
    return profile
  },

  updateProfile: async (updates) => {
    const { profile } = get()
    if (!profile) return
    const updated = { ...profile, ...updates }
    await saveUserProfile(updated)
    set({ profile: updated })
  },

  setLevel: async (assessment) => {
    const { profile } = get()
    if (!profile) return
    const updated = {
      ...profile,
      level: assessment.assignedLevel,
      assessment,
    }
    await saveUserProfile(updated)
    set({ profile: updated, isOnboarded: true })
  },

  setMode: async (mode) => {
    await get().updateProfile({ userMode: mode })
  },

  setImbalanceAssessment: async (assessment) => {
    const { profile } = get()
    if (!profile) return
    const updated = {
      ...profile,
      imbalanceAssessment: assessment,
    }
    await saveUserProfile(updated)
    set({ profile: updated, isOnboarded: true })
  },

  setSelectedCategories: async (categories) => {
    await get().updateProfile({ selectedCategories: categories })
  },

  setSelectedScenes: async (scenes) => {
    await get().updateProfile({ selectedScenes: scenes })
  },

  setAIProvider: async (provider) => {
    const { profile } = get()
    if (!profile) return
    await get().updateProfile({
      preferences: { ...profile.preferences, aiProvider: provider },
    })
  },

  setSearchProviders: async (providers) => {
    const { profile } = get()
    if (!profile) return
    await get().updateProfile({
      preferences: { ...profile.preferences, searchProviders: providers },
    })
  },

  setApiKey: async (provider, key) => {
    const { profile } = get()
    if (!profile) return
    await get().updateProfile({
      preferences: {
        ...profile.preferences,
        apiKeys: { ...profile.preferences.apiKeys, [provider]: key },
      },
    })
  },

  incrementStreak: async () => {
    const { profile } = get()
    if (!profile) return
    const newStreak = profile.streak + 1
    await get().updateProfile({
      streak: newStreak,
      longestStreak: Math.max(newStreak, profile.longestStreak),
    })
  },

  resetStreak: async () => {
    await get().updateProfile({ streak: 0 })
  },

  completeExercise: async (score, type) => {
    const { profile, todayProgress } = get()
    if (!profile) return

    const today = getToday()
    const progress: DailyProgress = todayProgress || {
      date: today,
      exercisesCompleted: 0,
      exercisesGoal: profile.dailyGoal,
      totalScore: 0,
      averageScore: 0,
      exerciseTypes: {},
      timeSpentMinutes: 0,
    }

    progress.exercisesCompleted += 1
    progress.totalScore += score
    progress.averageScore = Math.round(progress.totalScore / progress.exercisesCompleted)
    progress.exerciseTypes[type] = (progress.exerciseTypes[type] || 0) + 1

    await saveDailyProgress(progress)
    set({ todayProgress: { ...progress } })

    await get().updateProfile({
      totalExercisesCompleted: profile.totalExercisesCompleted + 1,
    })
  },

  loadTodayProgress: async () => {
    const today = getToday()
    const progress = await getDailyProgress(today)
    set({ todayProgress: progress || null })
  },
}))
