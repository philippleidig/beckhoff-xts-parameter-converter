import { create } from 'zustand'
import {
  DEFAULT_TMC_VERSION,
  findVersion,
  loadTmcVersion,
  setActiveTmcVersion,
} from '@/lib/tmc/registry'

const STORAGE_KEY = 'xts-tmc-version'

interface TmcVersionStore {
  /** The TcIoXts version every view currently describes and exports for. */
  version: string
  loading: boolean
  /** Set when a version could not be loaded and the previous one is still in use. */
  error: string | null
  select: (version: string) => Promise<void>
}

/**
 * Which TcIoXts version the application is working against.
 *
 * The choice is global rather than per-view: the parameter names, units and enum
 * values shown in Convert, Create and Compare all come from the selected version's
 * driver metadata, so scoping it to the export step would mean the rest of the UI
 * described a different driver than the file being produced.
 *
 * Components that render driver metadata subscribe to `version` so they re-render
 * when it changes; the metadata itself is read from `@/lib/tmc/registry`.
 */
export const useTmcVersionStore = create<TmcVersionStore>((set, get) => ({
  version: DEFAULT_TMC_VERSION,
  loading: false,
  error: null,

  select: async (version) => {
    if (version === get().version) return

    set({ loading: true, error: null })

    const loaded = await loadTmcVersion(version)
    if (!loaded) {
      set({
        loading: false,
        error: `TcIoXts ${version} is not available. Still using ${get().version}.`,
      })
      return
    }

    setActiveTmcVersion(version)
    set({ version, loading: false, error: null })
    persist(version)
  },
}))

function persist(version: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, version)
  } catch {
    // A blocked or full localStorage is not a reason to fail the selection.
  }
}

/**
 * Restores the previously selected version.
 *
 * A stored version can outlive its artifacts — a release is withdrawn, or the store is
 * pruned — so anything that no longer exists is dropped silently in favour of the
 * default. Surfacing that as an error on start-up would blame the user for something
 * that happened in a data update.
 */
export async function restoreSelectedTmcVersion(): Promise<void> {
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return
  }

  if (!stored || stored === DEFAULT_TMC_VERSION || !findVersion(stored)) return

  await useTmcVersionStore.getState().select(stored)
}
