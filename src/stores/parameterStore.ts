import { create } from 'zustand'
import type { SoftDriveParameters, MoverControllerParameters } from '@/lib/converter/types'
import { convertParameters } from '@/lib/converter/converter'
import { applyVariant, hasAreaConfiguration } from '@/lib/converter/areas'
import type { ParameterSetVariant } from '@/lib/converter/areas'
import { MAGNET_PLATE_TYPES } from '@/lib/constants/magnetPlateTypes'
import { createDefaultSoftDriveParameters } from '@/lib/converter/defaults'
import { parseSoftDriveXml } from '@/lib/xml/parser'
import type { SourceFormat } from '@/lib/xml/locate'
import type { ControlArea } from '@/lib/xml/controlAreas'
import { validateSoftDriveXml } from '@/lib/xml/validator'

interface ParameterStore {
  selectedMagnetPlateType: string | null
  softDriveParams: SoftDriveParameters | null
  controlAreas: ControlArea[]
  sourceFormat: SourceFormat | null
  sourceFileName: string | null
  validationErrors: string[]
  validationWarnings: string[]

  setMagnetPlateType: (type: string) => void
  importFromFile: (content: string, fileName?: string) => void
  loadDefaults: () => void
  setSoftDriveParam: <M extends keyof SoftDriveParameters>(
    module: M,
    param: keyof SoftDriveParameters[M],
    value: string | number
  ) => void
  resetParameters: () => void

  getConvertedParams: (variant?: ParameterSetVariant) => MoverControllerParameters | null
  hasAreaSet: () => boolean
}

export const useParameterStore = create<ParameterStore>((set, get) => ({
  selectedMagnetPlateType: null,
  softDriveParams: null,
  controlAreas: [],
  sourceFormat: null,
  sourceFileName: null,
  validationErrors: [],
  validationWarnings: [],

  setMagnetPlateType: (type: string) => {
    set({ selectedMagnetPlateType: type })
  },

  importFromFile: (content: string, fileName?: string) => {
    const validation = validateSoftDriveXml(content)
    if (!validation.valid) {
      set({ validationErrors: validation.errors, validationWarnings: [] })
      return
    }

    try {
      const { params, controlAreas, format } = parseSoftDriveXml(content)
      set({
        softDriveParams: params,
        controlAreas,
        sourceFormat: format,
        sourceFileName: fileName ?? null,
        validationErrors: [],
        validationWarnings: validation.warnings,
      })
    } catch (err) {
      set({
        validationErrors: [err instanceof Error ? err.message : 'Failed to parse XML'],
        validationWarnings: [],
      })
    }
  },

  loadDefaults: () => {
    set({
      softDriveParams: createDefaultSoftDriveParameters(),
      controlAreas: [],
      sourceFormat: null,
      sourceFileName: null,
      validationErrors: [],
      validationWarnings: [],
    })
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
    set({
      softDriveParams: null,
      selectedMagnetPlateType: null,
      controlAreas: [],
      sourceFormat: null,
      sourceFileName: null,
      validationErrors: [],
      validationWarnings: [],
    })
  },

  getConvertedParams: (variant: ParameterSetVariant = 'base') => {
    const state = get()
    if (!state.softDriveParams || !state.selectedMagnetPlateType) return null
    const magnetPlate = MAGNET_PLATE_TYPES[state.selectedMagnetPlateType]
    if (!magnetPlate) return null
    return convertParameters(applyVariant(state.softDriveParams, variant), magnetPlate.forceFactor)
  },

  hasAreaSet: () => {
    const state = get()
    return hasAreaConfiguration(state.softDriveParams, state.controlAreas)
  },
}))
