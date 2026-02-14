import { create } from 'zustand'
import type { SoftDriveParameters, MoverControllerParameters } from '@/lib/converter/types'
import { convertParameters } from '@/lib/converter/converter'
import { MOVER_TYPES } from '@/lib/constants/moverTypes'
import { createDefaultSoftDriveParameters } from '@/lib/converter/defaults'
import { parseSoftDriveXml } from '@/lib/xml/parser'
import { validateSoftDriveXml } from '@/lib/xml/validator'

interface ParameterStore {
  selectedMoverType: string | null
  softDriveParams: SoftDriveParameters | null
  validationErrors: string[]
  validationWarnings: string[]

  setMoverType: (type: string) => void
  importFromXml: (xmlString: string) => void
  loadDefaults: () => void
  setSoftDriveParam: <M extends keyof SoftDriveParameters>(
    module: M,
    param: keyof SoftDriveParameters[M],
    value: string | number
  ) => void
  resetParameters: () => void

  getConvertedParams: () => MoverControllerParameters | null
}

export const useParameterStore = create<ParameterStore>((set, get) => ({
  selectedMoverType: null,
  softDriveParams: null,
  validationErrors: [],
  validationWarnings: [],

  setMoverType: (type: string) => {
    set({ selectedMoverType: type })
  },

  importFromXml: (xmlString: string) => {
    const validation = validateSoftDriveXml(xmlString)
    if (!validation.valid) {
      set({ validationErrors: validation.errors, validationWarnings: [] })
      return
    }

    try {
      const params = parseSoftDriveXml(xmlString)
      set({ softDriveParams: params, validationErrors: [], validationWarnings: validation.warnings })
    } catch (err) {
      set({ validationErrors: [err instanceof Error ? err.message : 'Failed to parse XML'], validationWarnings: [] })
    }
  },

  loadDefaults: () => {
    set({ softDriveParams: createDefaultSoftDriveParameters(), validationErrors: [], validationWarnings: [] })
  },

  setSoftDriveParam: (module, param, value) => {
    const state = get()
    if (!state.softDriveParams) return

    set({
      softDriveParams: {
        ...state.softDriveParams,
        [module]: {
          ...state.softDriveParams[module],
          [param]: value,
        },
      },
    })
  },

  resetParameters: () => {
    set({ softDriveParams: null, selectedMoverType: null, validationErrors: [], validationWarnings: [] })
  },

  getConvertedParams: () => {
    const state = get()
    if (!state.softDriveParams || !state.selectedMoverType) return null
    const moverType = MOVER_TYPES[state.selectedMoverType]
    if (!moverType) return null
    return convertParameters(state.softDriveParams, moverType.forceFactor)
  },
}))
