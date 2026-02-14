import { MODULE_TYPE_IDS, SOFTDRIVE_TYPE_IDS } from '@/lib/constants/moverTypes'
import { SD_PARAMETER_META } from '@/lib/converter/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/** Enum parameters that have Area variants not available in the MoverController (TcIoXts.tmc). */
const AREA_ENUM_VALUES: Record<string, { paramLabel: string; areaValues: string[] }> = {
  'positionControl:PositionLoopType': {
    paramLabel: 'Position Loop Type',
    areaValues: ['P_POSITION_STANDSTILL_AREA'],
  },
  'velocityControl:VelocityLoopType': {
    paramLabel: 'Velocity Loop Type',
    areaValues: ['PI_VELOCITY_STANDSTILL_AREA'],
  },
  'feedForward:FeedforwardType': {
    paramLabel: 'Feed Forward Type',
    areaValues: ['FFT_ON_AREA'],
  },
}

const MODULE_TO_TYPE_ID: Record<string, { name: string; typeId: string }> = {
  interpolator: { name: 'Interpolator', typeId: MODULE_TYPE_IDS.interpolator },
  encoder: { name: 'Encoder', typeId: MODULE_TYPE_IDS.encoder },
  positionControl: { name: 'PositionControl', typeId: MODULE_TYPE_IDS.positionControl },
  velocityControl: { name: 'VelocityControl', typeId: MODULE_TYPE_IDS.velocityControl },
  filter: { name: 'Filter', typeId: MODULE_TYPE_IDS.filter },
  feedForward: { name: 'FeedForward', typeId: MODULE_TYPE_IDS.feedForward },
}

interface ModuleEnumCheck {
  moduleKey: string
  moduleName: string
  typeId: string
  params: Array<{ xmlName: string; paramKey: string; validValues: string[] }>
}

function buildModuleEnumChecks(): ModuleEnumCheck[] {
  const result: ModuleEnumCheck[] = []

  for (const [moduleKey, meta] of Object.entries(SD_PARAMETER_META)) {
    const moduleInfo = MODULE_TO_TYPE_ID[moduleKey]
    if (!moduleInfo) continue

    const params: ModuleEnumCheck['params'] = []
    for (const [paramKey, paramMeta] of Object.entries(meta)) {
      if (paramMeta.type === 'enum' && paramMeta.enumOptions) {
        const xmlName = moduleKey === 'filter' ? `ConfigurationFilter.${paramMeta.name}` : paramMeta.name
        params.push({ xmlName, paramKey, validValues: paramMeta.enumOptions })
      }
    }

    if (params.length > 0) {
      result.push({ moduleKey, moduleName: moduleInfo.name, typeId: moduleInfo.typeId, params })
    }
  }

  return result
}

const MODULE_ENUM_CHECKS = buildModuleEnumChecks()

export function validateSoftDriveXml(xmlString: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    return { valid: false, errors: [`XML parse error: ${parseError.textContent}`], warnings }
  }

  const root = doc.documentElement
  if (root.tagName !== 'ParameterExport') {
    errors.push(`Expected root element 'ParameterExport', found '${root.tagName}'`)
    return { valid: false, errors, warnings }
  }

  const softDriveSet = findSoftDriveParameterSet(doc)
  if (!softDriveSet) {
    errors.push('No ParameterSet with TypeId "SoftDrive" found')
    return { valid: false, errors, warnings }
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

  // If structural errors exist, skip enum validation
  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  // Validate enum values and detect Area usage
  for (const moduleCheck of MODULE_ENUM_CHECKS) {
    const childSet = findChildParameterSetByTypeId(softDriveSet, moduleCheck.typeId)
    if (!childSet) continue

    for (const param of moduleCheck.params) {
      const value = getEnumValueFromSet(childSet, param.xmlName)
      if (value === null) continue

      if (!param.validValues.includes(value)) {
        errors.push(
          `Invalid value '${value}' for ${moduleCheck.moduleName}.${param.paramKey}. ` +
          `Valid values: ${param.validValues.join(', ')}`
        )
      }

      const areaKey = `${moduleCheck.moduleKey}:${param.paramKey}`
      const areaCheck = AREA_ENUM_VALUES[areaKey]
      if (areaCheck && areaCheck.areaValues.includes(value)) {
        warnings.push(
          `${areaCheck.paramLabel} uses '${value}'. ` +
          `Area-specific parameters were detected. A Control Area with an additional ParameterSet ` +
          `will likely need to be created in the MoverController to map the Area-specific values.`
        )
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
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

function getEnumValueFromSet(paramSet: Element, name: string): string | null {
  const values = paramSet.querySelectorAll(':scope > ParameterValues > Value')
  for (const val of values) {
    const nameEl = val.querySelector(':scope > Name')
    if (nameEl?.textContent?.trim() === name) {
      const enumEl = val.querySelector(':scope > EnumText')
      if (enumEl?.textContent) return enumEl.textContent.trim()
      const valueEl = val.querySelector(':scope > Value')
      if (valueEl?.textContent) return valueEl.textContent.trim()
    }
  }
  return null
}
