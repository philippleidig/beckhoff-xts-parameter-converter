import { MODULE_TYPE_IDS, SOFTDRIVE_TYPE_IDS } from '@/lib/constants/moverTypes'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateSoftDriveXml(xmlString: string): ValidationResult {
  const errors: string[] = []

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    return { valid: false, errors: [`XML parse error: ${parseError.textContent}`] }
  }

  const root = doc.documentElement
  if (root.tagName !== 'ParameterExport') {
    errors.push(`Expected root element 'ParameterExport', found '${root.tagName}'`)
    return { valid: false, errors }
  }

  const softDriveSet = findSoftDriveParameterSet(doc)
  if (!softDriveSet) {
    errors.push('No ParameterSet with TypeId "SoftDrive" found')
    return { valid: false, errors }
  }

  const requiredModules: Array<{ name: string; typeId: string }> = [
    { name: 'Interpolator', typeId: MODULE_TYPE_IDS.interpolator },
    { name: 'Encoder', typeId: MODULE_TYPE_IDS.encoder },
    { name: 'PositionControl', typeId: MODULE_TYPE_IDS.positionControl },
    { name: 'VelocityControl', typeId: MODULE_TYPE_IDS.velocityControl },
    { name: 'Filter', typeId: MODULE_TYPE_IDS.filter },
    { name: 'FeedForward', typeId: MODULE_TYPE_IDS.feedForward },
  ]

  for (const mod of requiredModules) {
    const childSet = findChildParameterSetByTypeId(softDriveSet, mod.typeId)
    if (!childSet) {
      errors.push(`Missing required module: ${mod.name} (TypeId: ${mod.typeId})`)
    }
  }

  return { valid: errors.length === 0, errors }
}

function findSoftDriveParameterSet(doc: Document): Element | null {
  const allSets = doc.querySelectorAll('ParameterSet')
  for (const typeId of SOFTDRIVE_TYPE_IDS) {
    for (const set of allSets) {
      const typeIdEl = set.querySelector(':scope > TypeId')
      if (typeIdEl?.textContent?.trim().toLowerCase() === typeId.toLowerCase()) {
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
    const typeIdEl = set.querySelector(':scope > TypeId')
    if (typeIdEl?.textContent?.trim().toLowerCase() === typeId.toLowerCase()) {
      return set
    }
  }
  return null
}
