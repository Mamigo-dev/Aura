import { create } from 'zustand'

interface CategoryState {
  selectedLevel1: string | null
  selectedLevel2: string | null
  selectedLevel3: string | null
  browsingLevel: 1 | 2 | 3

  // Actions
  selectLevel1: (id: string) => void
  selectLevel2: (id: string) => void
  selectLevel3: (id: string) => void
  goBack: () => void
  reset: () => void
  getFullPath: () => [string, string, string] | null
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  selectedLevel1: null,
  selectedLevel2: null,
  selectedLevel3: null,
  browsingLevel: 1,

  selectLevel1: (id) => set({ selectedLevel1: id, selectedLevel2: null, selectedLevel3: null, browsingLevel: 2 }),
  selectLevel2: (id) => set({ selectedLevel2: id, selectedLevel3: null, browsingLevel: 3 }),
  selectLevel3: (id) => set({ selectedLevel3: id }),

  goBack: () => {
    const { browsingLevel } = get()
    if (browsingLevel === 3) {
      set({ selectedLevel2: null, selectedLevel3: null, browsingLevel: 2 })
    } else if (browsingLevel === 2) {
      set({ selectedLevel1: null, selectedLevel2: null, selectedLevel3: null, browsingLevel: 1 })
    }
  },

  reset: () => set({
    selectedLevel1: null,
    selectedLevel2: null,
    selectedLevel3: null,
    browsingLevel: 1,
  }),

  getFullPath: () => {
    const { selectedLevel1, selectedLevel2, selectedLevel3 } = get()
    if (selectedLevel1 && selectedLevel2 && selectedLevel3) {
      return [selectedLevel1, selectedLevel2, selectedLevel3]
    }
    return null
  },
}))
