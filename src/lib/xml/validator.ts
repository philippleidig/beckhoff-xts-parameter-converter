import { MODULE_TYPE_IDS } from '@/lib/constants/magnetPlateTypes'
import type { ModuleKey } from '@/lib/constants/magnetPlateTypes'
import { SD_PARAMETER_META } from '@/lib/converter/types'
import { AREA_ENUM_VALUES } from '@/lib/converter/areas'
import { locateSoftDrive, getEnumValue } from './locate'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/** Root elements of the two supported source formats. */
const SUPPORTED_ROOTS = ['ParameterExport', 'TcSmItem']

const MODULE_DISPLAY_NAMES: Record<ModuleKey, string> = {
  interpolator: 'Interpolator',
  encoder: 'Encoder',
  positionControl: 'PositionControl',
  velocityControl: 'VelocityControl',
  filter: 'Filter',
  feedForward: 'FeedForward',
}

interface ModuleEnumCheck {
  moduleKey: ModuleKey
  moduleName: string
  params: Array<{ xmlName: string; paramKey: string; validValues: string[] }>
}

function buildModuleEnumChecks(): ModuleEnumCheck[] {
  const result: ModuleEnumCheck[] = []

  for (const [moduleKey, meta] of Object.entries(SD_PARAMETER_META)) {
    const moduleName = MODULE_DISPLAY_NAMES[moduleKey as ModuleKey]
    if (!moduleName) continue

    const params: ModuleEnumCheck['params'] = []
    for (const [paramKey, paramMeta] of Object.entries(meta)) {
      if (paramMeta.type === 'enum' && paramMeta.enumOptions) {
        const xmlName = moduleKey === 'filter' ? `ConfigurationFilter.${paramMeta.name}` : paramMeta.name
        params.push({ xmlName, paramKey, validValues: paramMeta.enumOptions })
      }
    }

    if (params.length > 0) {
      result.push({ moduleKey: moduleKey as ModuleKey, moduleName, params })
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
  if (!SUPPORTED_ROOTS.includes(root.tagName)) {
    errors.push(
      `Expected root element 'ParameterExport' (Parameter Set export) or ` +
      `'TcSmItem' (Mover Axis XTI), found '${root.tagName}'`
    )
    return { valid: false, errors, warnings }
  }

  const located = locateSoftDrive(doc)
  if (!located) {
    errors.push('No SoftDrive parameters found in the file')
    return { valid: false, errors, warnings }
  }

  for (const [key, name] of Object.entries(MODULE_DISPLAY_NAMES) as [ModuleKey, string][]) {
    if (!located.modules[key]) {
      errors.push(`Missing required module: ${name} (TypeId: ${MODULE_TYPE_IDS[key]})`)
    }
  }

  // If structural errors exist, skip enum validation
  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  // Validate enum values and detect Area usage
  for (const moduleCheck of MODULE_ENUM_CHECKS) {
    const childSet = located.modules[moduleCheck.moduleKey]
    if (!childSet) continue

    for (const param of moduleCheck.params) {
      const value = getEnumValue(childSet, param.xmlName)
      if (value === null) continue

      if (!param.validValues.includes(value)) {
        errors.push(
          `Invalid value '${value}' for ${moduleCheck.moduleName}.${param.paramKey}. ` +
          `Valid values: ${param.validValues.join(', ')}`
        )
      }

      const areaCheck = AREA_ENUM_VALUES[`${moduleCheck.moduleKey}:${param.paramKey}`]
      if (areaCheck && areaCheck.areaValues.includes(value)) {
        warnings.push(
          `${areaCheck.paramLabel} uses '${value}' — its _area values are exported as a ` +
          `second parameter set for the Control Areas.`
        )
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
