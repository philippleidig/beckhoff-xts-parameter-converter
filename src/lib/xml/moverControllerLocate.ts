import { MC_MODULE_TYPE_IDS, MOVER_CONTROLLER_TYPE_IDS } from '@/lib/constants/moverControllerTypes'
import type { McModuleKey } from '@/lib/constants/moverControllerTypes'
import { indexModuleDescriptions, normalizeId } from './locate'

export interface LocatedMoverController {
  /** Element carrying the MoverController-level ParameterValues. */
  root: Element
  /** Elements carrying each sub-module's ParameterValues. */
  modules: Record<McModuleKey, Element | null>
}

const MC_MODULE_KEYS = Object.keys(MC_MODULE_TYPE_IDS) as McModuleKey[]

/**
 * Finds the MoverController object and its six parameter modules in a `.xti`.
 *
 * Both parameter generations are stored in a `<TcSmItem>`, so the root element says
 * nothing about which one a file holds — only the module GUIDs do. Returns null when
 * the document carries no MoverController, which is how a SoftDrive file is told apart
 * from a MoverController file.
 */
export function locateMoverController(doc: Document): LocatedMoverController | null {
  const byGuid = indexModuleDescriptions(doc)

  let root: Element | null = null
  for (const typeId of MOVER_CONTROLLER_TYPE_IDS) {
    const match = byGuid.get(normalizeId(typeId))
    if (match) {
      root = match
      break
    }
  }
  if (!root) return null

  const modules = {} as Record<McModuleKey, Element | null>
  for (const key of MC_MODULE_KEYS) {
    modules[key] = byGuid.get(normalizeId(MC_MODULE_TYPE_IDS[key])) ?? null
  }

  return { root, modules }
}
