import { create } from 'zustand'
import type { OpenProjectInfo } from '@shared-types/project'

interface ProjectState {
  current: OpenProjectInfo | null
  setCurrent(info: OpenProjectInfo | null): void
}

export const useProjectStore = create<ProjectState>((set) => ({
  current: null,
  setCurrent: (info) => set({ current: info })
}))
