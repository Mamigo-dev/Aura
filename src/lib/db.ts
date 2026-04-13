import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { UserProfile, DailyProgress } from '../types/user'
import type { Exercise } from '../types/exercise'
import type { ExerciseResult } from '../types/scoring'

interface AuraDB extends DBSchema {
  userProfile: {
    key: string
    value: UserProfile
  }
  exercises: {
    key: string
    value: Exercise
    indexes: {
      'by-level': string
      'by-type': string
      'by-created': string
    }
  }
  exerciseResults: {
    key: string
    value: ExerciseResult
    indexes: {
      'by-date': string
      'by-exercise': string
    }
  }
  dailyProgress: {
    key: string // YYYY-MM-DD
    value: DailyProgress
  }
  cachedContent: {
    key: string
    value: {
      id: string
      content: string
      source: string
      category: string
      fetchedAt: string
      expiresAt: string
    }
  }
  offlineQueue: {
    key: string
    value: {
      id: string
      endpoint: string
      payload: unknown
      createdAt: string
    }
  }
  stories: {
    key: string
    value: {
      id: string
      title: string
      content: string
      trendingWords: { word: string; definition: string; pronunciation?: string; examples: string[] }[]
      category: string
      createdAt: string
    }
  }
}

let dbInstance: IDBPDatabase<AuraDB> | null = null

export async function getDB(): Promise<IDBPDatabase<AuraDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<AuraDB>('aura-db', 1, {
    upgrade(db) {
      // User profile store
      db.createObjectStore('userProfile', { keyPath: 'id' })

      // Exercises store
      const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' })
      exerciseStore.createIndex('by-level', 'level')
      exerciseStore.createIndex('by-type', 'type')
      exerciseStore.createIndex('by-created', 'createdAt')

      // Exercise results store
      const resultStore = db.createObjectStore('exerciseResults', { keyPath: 'id' })
      resultStore.createIndex('by-date', 'completedAt')
      resultStore.createIndex('by-exercise', 'exerciseId')

      // Daily progress store
      db.createObjectStore('dailyProgress', { keyPath: 'date' })

      // Cached content store
      db.createObjectStore('cachedContent', { keyPath: 'id' })

      // Offline queue store
      db.createObjectStore('offlineQueue', { keyPath: 'id' })

      // Stories store
      db.createObjectStore('stories', { keyPath: 'id' })
    },
  })

  return dbInstance
}

// User Profile operations
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDB()
  await db.put('userProfile', profile)
}

export async function getUserProfile(): Promise<UserProfile | undefined> {
  const db = await getDB()
  const all = await db.getAll('userProfile')
  return all[0]
}

// Exercise operations
export async function saveExercise(exercise: Exercise): Promise<void> {
  const db = await getDB()
  await db.put('exercises', exercise)
}

export async function getExercisesByLevel(level: string): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAllFromIndex('exercises', 'by-level', level)
}

export async function getExercisesByType(type: string): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAllFromIndex('exercises', 'by-type', type)
}

// Exercise result operations
export async function saveExerciseResult(result: ExerciseResult): Promise<void> {
  const db = await getDB()
  await db.put('exerciseResults', result)
}

export async function getExerciseResults(): Promise<ExerciseResult[]> {
  const db = await getDB()
  return db.getAll('exerciseResults')
}

export async function getResultsByDateRange(start: string, end: string): Promise<ExerciseResult[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(start, end)
  return db.getAllFromIndex('exerciseResults', 'by-date', range)
}

// Daily progress operations
export async function saveDailyProgress(progress: DailyProgress): Promise<void> {
  const db = await getDB()
  await db.put('dailyProgress', progress)
}

export async function getDailyProgress(date: string): Promise<DailyProgress | undefined> {
  const db = await getDB()
  return db.get('dailyProgress', date)
}

export async function getAllDailyProgress(): Promise<DailyProgress[]> {
  const db = await getDB()
  return db.getAll('dailyProgress')
}

// Offline queue operations
export async function addToOfflineQueue(endpoint: string, payload: unknown): Promise<void> {
  const db = await getDB()
  await db.put('offlineQueue', {
    id: crypto.randomUUID(),
    endpoint,
    payload,
    createdAt: new Date().toISOString(),
  })
}

export async function getOfflineQueue() {
  const db = await getDB()
  return db.getAll('offlineQueue')
}

export async function clearOfflineQueue(): Promise<void> {
  const db = await getDB()
  await db.clear('offlineQueue')
}

// Stories operations
export async function saveStory(story: AuraDB['stories']['value']): Promise<void> {
  const db = await getDB()
  await db.put('stories', story)
}

export async function getStories() {
  const db = await getDB()
  return db.getAll('stories')
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await Promise.all([
    db.clear('userProfile'),
    db.clear('exercises'),
    db.clear('exerciseResults'),
    db.clear('dailyProgress'),
    db.clear('cachedContent'),
    db.clear('offlineQueue'),
    db.clear('stories'),
  ])
}
