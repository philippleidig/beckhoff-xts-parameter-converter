import { MODULE_TYPE_IDS, SOFTDRIVE_TYPE_IDS } from '@/lib/constants/magnetPlateTypes'
import type { ModuleKey } from '@/lib/constants/magnetPlateTypes'

/**
 * The two file formats that carry SoftDrive parameters:
 *
 * - `parameterSet`  — `<ParameterExport>` written by the XTS Configurator
 *                     ("Export Parameter Set…"). Modules are nested
 *                     `<ParameterSet>` elements identified by `<TypeId>`.
 * - `moverAxisXti`  — `<TcSmItem ClassName="CNcAxisDef">` written by TwinCAT
 *                     ("Save Mover Axis 1 As…"). Modules are `<Module>` elements
 *                     identified by the `GUID` attribute of their `<TmcDesc>`.
 *
 * Both formats store the actual values in an identical
 * `<ParameterValues><Value><Name>…` structure and use identical parameter names,
 * so only the *lookup* of the containing element differs.
 */
export type SourceFormat = 'parameterSet' | 'moverAxisXti'

export interface LocatedSoftDrive {
  format: SourceFormat
  /** Element carrying the SoftDrive-level ParameterValues (holds ControlAreas). */
  root: Element
  /** Elements carrying each sub-module's ParameterValues. */
  modules: Record<ModuleKey, Element | null>
}

const MODULE_KEYS = Object.keys(MODULE_TYPE_IDS) as ModuleKey[]

/** Normalize a TypeId or TmcDesc GUID so `{8D695A14-…}` and `8d695a14-…` compare equal. */
function normalizeId(raw: string | null | undefined): string {
  return (raw ?? '').replace(/[{}]/g, '').trim().toLowerCase()
}

export function locateSoftDrive(doc: Document): LocatedSoftDrive | null {
  const rootTag = doc.documentElement?.tagName

  // Try the format the root element advertises first, then fall back to the other
  // one — an .xti renamed to .xml (or vice versa) still imports correctly.
  const order: SourceFormat[] =
    rootTag === 'TcSmItem' ? ['moverAxisXti', 'parameterSet'] : ['parameterSet', 'moverAxisXti']

  for (const format of order) {
    const located = format === 'parameterSet' ? locateParameterSet(doc) : locateMoverAxisXti(doc)
    if (located) return located
  }
  return null
}

// ============================================================
// ParameterExport (.xml)
// ============================================================

function locateParameterSet(doc: Document): LocatedSoftDrive | null {
  const softDriveSet = findSoftDriveParameterSet(doc)
  if (!softDriveSet) return null

  const modules = {} as Record<ModuleKey, Element | null>
  for (const key of MODULE_KEYS) {
    modules[key] = findChildParameterSetByTypeId(softDriveSet, MODULE_TYPE_IDS[key])
  }

  return { format: 'parameterSet', root: softDriveSet, modules }
}

function findSoftDriveParameterSet(doc: Document): Element | null {
  const allSets = doc.querySelectorAll('ParameterSet')
  for (const typeId of SOFTDRIVE_TYPE_IDS) {
    for (const set of allSets) {
      if (normalizeId(set.querySelector(':scope > TypeId')?.textContent) === normalizeId(typeId)) {
        return set
      }
    }
  }
  // Fallback: find by Name containing "SoftDrive"
  for (const set of allSets) {
    const nameEl = set.querySelector(':scope > Name')
    if (nameEl?.textContent?.toLowerCase().includes('softdrive')) {
      return set
    }
  }
  return null
}

function findChildParameterSetByTypeId(parent: Element, typeId: string): Element | null {
  const paramSets = parent.querySelectorAll(':scope > ParameterSets > ParameterSet')
  for (const set of paramSets) {
    if (normalizeId(set.querySelector(':scope > TypeId')?.textContent) === normalizeId(typeId)) {
      return set
    }
  }
  return null
}

// ============================================================
// Mover Axis (.xti)
// ============================================================

function locateMoverAxisXti(doc: Document): LocatedSoftDrive | null {
  // Index every module description by its normalized GUID. The SoftDrive module and
  // its six children are siblings-of-TmcDesc in the tree, so a flat lookup suffices.
  const byGuid = new Map<string, Element>()
  for (const desc of doc.querySelectorAll('Module > TmcDesc')) {
    const guid = normalizeId(desc.getAttribute('GUID'))
    if (guid && !byGuid.has(guid)) byGuid.set(guid, desc)
  }

  let root: Element | null = null
  for (const typeId of SOFTDRIVE_TYPE_IDS) {
    const match = byGuid.get(normalizeId(typeId))
    if (match) {
      root = match
      break
    }
  }
  if (!root) return null

  const modules = {} as Record<ModuleKey, Element | null>
  for (const key of MODULE_KEYS) {
    modules[key] = byGuid.get(normalizeId(MODULE_TYPE_IDS[key])) ?? null
  }

  return { format: 'moverAxisXti', root, modules }
}

// ============================================================
// Value readers (identical for both formats)
// ============================================================

function findValueElement(container: Element | null, name: string): Element | null {
  if (!container) return null
  for (const val of container.querySelectorAll(':scope > ParameterValues > Value')) {
    if (val.querySelector(':scope > Name')?.textContent?.trim() === name) {
      return val
    }
  }
  return null
}

export function getNumericValue(container: Element | null, name: string): number | null {
  const valueEl = findValueElement(container, name)?.querySelector(':scope > Value')
  if (!valueEl?.textContent) return null
  const num = parseFloat(valueEl.textContent.trim())
  return isNaN(num) ? null : num
}

export function getEnumValue(container: Element | null, name: string): string | null {
  const val = findValueElement(container, name)
  if (!val) return null
  const enumEl = val.querySelector(':scope > EnumText')
  if (enumEl?.textContent) return enumEl.textContent.trim()
  const valueEl = val.querySelector(':scope > Value')
  if (valueEl?.textContent) return valueEl.textContent.trim()
  return null
}

/** True when the value is present and reads as boolean true (`TRUE`, `true`, `1`). */
export function getBooleanValue(container: Element | null, name: string): boolean | null {
  const raw = getEnumValue(container, name)
  if (raw === null) return null
  const normalized = raw.toLowerCase()
  return normalized === 'true' || normalized === '1'
}

/** True when the named value exists at all — used to detect the end of an array. */
export function hasValue(container: Element | null, name: string): boolean {
  return findValueElement(container, name) !== null
}
