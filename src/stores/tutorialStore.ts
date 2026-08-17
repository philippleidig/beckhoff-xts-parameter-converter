import { create } from 'zustand'
import { FIRST_STEP_ID, TUTORIAL_STEPS } from '@/lib/tutorial/steps'

const STORAGE_KEY = 'xts-tutorial-progress'

interface StoredProgress {
  activeStepId: string
  completed: string[]
}

interface TutorialStore extends StoredProgress {
  setActive: (id: string) => void
  markDone: (id: string) => void
  reset: () => void
}

function isKnownStep(id: string): boolean {
  return TUTORIAL_STEPS.some((step) => step.id === id)
}

/**
 * Restores the reader's position and ticked-off steps.
 *
 * Step ids change when the walkthrough is edited, so anything unknown is dropped rather
 * than leaving the tree pointing at a step that no longer exists.
 */
function restore(): StoredProgress {
  const empty: StoredProgress = { activeStepId: FIRST_STEP_ID, completed: [] }

  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return empty
  }
  if (!raw) return empty

  try {
    const parsed = JSON.parse(raw) as Partial<StoredProgress>
    return {
      activeStepId:
        typeof parsed.activeStepId === 'string' && isKnownStep(parsed.activeStepId)
          ? parsed.activeStepId
          : FIRST_STEP_ID,
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter(isKnownStep) : [],
    }
  } catch {
    return empty
  }
}

function persist(progress: StoredProgress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // A blocked or full localStorage is not a reason to break the walkthrough.
  }
}

/**
 * Where the reader is in the migration walkthrough.
 *
 * A migration spans several TwinCAT sessions rather than one sitting, so the progress is
 * kept in localStorage: closing the tab must not lose which steps are already done.
 */
export const useTutorialStore = create<TutorialStore>((set, get) => ({
  ...restore(),

  setActive: (id) => {
    if (!isKnownStep(id) || id === get().activeStepId) return
    set({ activeStepId: id })
    persist({ activeStepId: id, completed: get().completed })
  },

  markDone: (id) => {
    const { activeStepId, completed } = get()
    if (!isKnownStep(id) || completed.includes(id)) return

    const next = [...completed, id]
    set({ completed: next })
    persist({ activeStepId, completed: next })
  },

  reset: () => {
    const empty: StoredProgress = { activeStepId: FIRST_STEP_ID, completed: [] }
    set(empty)
    persist(empty)
  },
}))
