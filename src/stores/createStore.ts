import { create } from 'zustand'
import type { MoverControllerParameters } from '@/lib/converter/types'
import { createDefaultMoverControllerParameters } from '@/lib/converter/defaults'
import { parseMoverControllerXti } from '@/lib/xml/moverControllerParser'
import { validateMoverControllerXti } from '@/lib/xml/moverControllerValidator'

interface CreateStore {
  params: MoverControllerParameters
  /** Where the current values came from, or null while they are the untouched defaults. */
  sourceFileName: string | null
  /** True once a value has been edited or a file has been loaded. */
  modified: boolean
  validationErrors: string[]

  setParam: <M extends keyof MoverControllerParameters>(
    module: M,
    param: keyof MoverControllerParameters[M],
    value: string | number
  ) => void
  loadFromFile: (content: string, fileName: string) => void
  reset: () => void
}

export const useCreateStore = create<CreateStore>((set, get) => ({
  params: createDefaultMoverControllerParameters(),
  sourceFileName: null,
  modified: false,
  validationErrors: [],

  setParam: (module, param, value) => {
    const state = get()
    set({
      params: {
        ...state.params,
        [module]: {
          ...state.params[module],
          [param]: value,
        },
      },
      modified: true,
    })
  },

  loadFromFile: (content: string, fileName: string) => {
    const validation = validateMoverControllerXti(content)
    if (!validation.valid) {
      set({ validationErrors: validation.errors })
      return
    }

    try {
      set({
        params: parseMoverControllerXti(content),
        sourceFileName: fileName,
        modified: true,
        validationErrors: [],
      })
    } catch (err) {
      set({ validationErrors: [err instanceof Error ? err.message : 'Failed to parse XML'] })
    }
  },

  reset: () => {
    set({
      params: createDefaultMoverControllerParameters(),
      sourceFileName: null,
      modified: false,
      validationErrors: [],
    })
  },
}))
