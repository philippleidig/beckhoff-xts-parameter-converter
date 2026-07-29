import { create } from 'zustand'
import type { SoftDriveParameters, MoverControllerParameters } from '@/lib/converter/types'
import {
  createDefaultSoftDriveParameters,
  createDefaultMoverControllerParameters,
} from '@/lib/converter/defaults'
import { detectParameterSetKind } from '@/lib/xml/detectFormat'
import type { ParameterSetKind } from '@/lib/xml/detectFormat'
import { parseSoftDriveXml } from '@/lib/xml/parser'
import { validateSoftDriveXml } from '@/lib/xml/validator'
import { parseMoverControllerXti } from '@/lib/xml/moverControllerParser'
import { validateMoverControllerXti } from '@/lib/xml/moverControllerValidator'

export type CompareSide = 'left' | 'right'

export interface CompareSlot {
  /** File name, or a description of where the values came from. */
  label: string
  kind: ParameterSetKind
  params: SoftDriveParameters | MoverControllerParameters
  isDefaults: boolean
}

interface CompareStore {
  left: CompareSlot | null
  right: CompareSlot | null
  errors: Record<CompareSide, string[]>

  loadFile: (side: CompareSide, content: string, fileName: string) => void
  loadDefaults: (side: CompareSide, kind: ParameterSetKind) => void
  clear: (side: CompareSide) => void
  reset: () => void
  /**
   * The generation both sides are pinned to, or null while both are empty. Only sets
   * of the same generation can be compared.
   */
  activeKind: () => ParameterSetKind | null
}

const KIND_LABELS: Record<ParameterSetKind, string> = {
  softDrive: 'SoftDrive (old)',
  moverController: 'MoverController (new)',
}

const noErrors: Record<CompareSide, string[]> = { left: [], right: [] }

function otherSide(side: CompareSide): CompareSide {
  return side === 'left' ? 'right' : 'left'
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  left: null,
  right: null,
  errors: noErrors,

  loadFile: (side, content, fileName) => {
    const setErrors = (messages: string[]) =>
      set({ errors: { ...get().errors, [side]: messages } })

    const kind = detectParameterSetKind(content)
    if (!kind) {
      setErrors([
        `'${fileName}' contains neither a SoftDrive nor a MoverController parameter set.`,
      ])
      return
    }

    // Converting between the generations renames and rescales parameters, so a value
    // from one says nothing about a value from the other. Only like-for-like compares.
    const opposite = get()[otherSide(side)]
    if (opposite && opposite.kind !== kind) {
      setErrors([
        `'${fileName}' holds ${KIND_LABELS[kind]} parameters, but the other side holds ` +
        `${KIND_LABELS[opposite.kind]} parameters. Compare old sets with old sets and new with new.`,
      ])
      return
    }

    const validation =
      kind === 'softDrive' ? validateSoftDriveXml(content) : validateMoverControllerXti(content)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    try {
      const params =
        kind === 'softDrive'
          ? parseSoftDriveXml(content).params
          : parseMoverControllerXti(content)

      set({
        [side]: { label: fileName, kind, params, isDefaults: false } satisfies CompareSlot,
        errors: { ...get().errors, [side]: [] },
      })
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to parse XML'])
    }
  },

  loadDefaults: (side, kind) => {
    const params =
      kind === 'softDrive'
        ? createDefaultSoftDriveParameters()
        : createDefaultMoverControllerParameters()

    set({
      [side]: {
        label: `${KIND_LABELS[kind]} default values`,
        kind,
        params,
        isDefaults: true,
      } satisfies CompareSlot,
      errors: { ...get().errors, [side]: [] },
    })
  },

  clear: (side) => {
    set({ [side]: null, errors: { ...get().errors, [side]: [] } })
  },

  reset: () => {
    set({ left: null, right: null, errors: noErrors })
  },

  activeKind: () => {
    const state = get()
    return state.left?.kind ?? state.right?.kind ?? null
  },
}))
