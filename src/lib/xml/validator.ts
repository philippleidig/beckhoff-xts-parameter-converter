import { MODULE_TYPE_IDS } from '@/lib/constants/magnetPlateTypes'
import type { ModuleKey } from '@/lib/constants/magnetPlateTypes'
import { SD_PARAMETER_META } from '@/lib/converter/types'
import { AREA_ENUM_VALUES } from '@/lib/converter/areas'
import { locateSoftDrive, getEnumValue, getRawValue, parseParameterNumber, parseXmlDocument } from './locate'
import type { LocatedSoftDrive } from './locate'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/** Root elements of the two supported source formats. */
const SUPPORTED_ROOTS = ['ParameterExport', 'TcSmItem']

/** The six required sub-modules. The SoftDrive root is handled separately. */
const MODULE_DISPLAY_NAMES: Record<ModuleKey, string> = {
  interpolator: 'Interpolator',
  encoder: 'Encoder',
  positionControl: 'PositionControl',
  velocityControl: 'VelocityControl',
  filter: 'Filter',
  feedForward: 'FeedForward',
}

/** Pseudo-module key for the parameters stored on the SoftDrive object itself. */
const SOFTDRIVE_ROOT_KEY = 'softDrive'

type EnumCheckModuleKey = ModuleKey | typeof SOFTDRIVE_ROOT_KEY

/** Resolves the element carrying a module's ParameterValues. */
function containerFor(located: LocatedSoftDrive, moduleKey: EnumCheckModuleKey): Element | null {
  return moduleKey === SOFTDRIVE_ROOT_KEY ? located.root : located.modules[moduleKey]
}

interface ModuleEnumCheck {
  moduleKey: EnumCheckModuleKey
  moduleName: string
  params: Array<{ xmlName: string; paramKey: string; validValues: string[] }>
}

interface ModuleNumberCheck {
  moduleKey: EnumCheckModuleKey
  moduleName: string
  params: Array<{ xmlName: string; paramKey: string }>
}

/** Display name of a SD_PARAMETER_META key, or null when it is not a real module. */
function moduleNameOf(moduleKey: string): string | null {
  if (moduleKey === SOFTDRIVE_ROOT_KEY) return 'SoftDrive'
  return MODULE_DISPLAY_NAMES[moduleKey as ModuleKey] ?? null
}

/** The filter module prefixes its parameter names in the file. */
function xmlNameOf(moduleKey: string, name: string): string {
  return moduleKey === 'filter' ? `ConfigurationFilter.${name}` : name
}

function buildModuleEnumChecks(): ModuleEnumCheck[] {
  const result: ModuleEnumCheck[] = []

  for (const [moduleKey, meta] of Object.entries(SD_PARAMETER_META)) {
    const moduleName = moduleNameOf(moduleKey)
    if (!moduleName) continue

    const params: ModuleEnumCheck['params'] = []
    for (const [paramKey, paramMeta] of Object.entries(meta)) {
      if (paramMeta.type === 'enum' && paramMeta.enumOptions) {
        params.push({
          xmlName: xmlNameOf(moduleKey, paramMeta.name),
          paramKey,
          validValues: paramMeta.enumOptions,
        })
      }
    }

    if (params.length > 0) {
      result.push({ moduleKey: moduleKey as EnumCheckModuleKey, moduleName, params })
    }
  }

  return result
}

function buildModuleNumberChecks(): ModuleNumberCheck[] {
  const result: ModuleNumberCheck[] = []

  for (const [moduleKey, meta] of Object.entries(SD_PARAMETER_META)) {
    const moduleName = moduleNameOf(moduleKey)
    if (!moduleName) continue

    const params: ModuleNumberCheck['params'] = []
    for (const [paramKey, paramMeta] of Object.entries(meta)) {
      if (paramMeta.type === 'number') {
        params.push({ xmlName: xmlNameOf(moduleKey, paramMeta.name), paramKey })
      }
    }

    if (params.length > 0) {
      result.push({ moduleKey: moduleKey as EnumCheckModuleKey, moduleName, params })
    }
  }

  return result
}

const MODULE_ENUM_CHECKS = buildModuleEnumChecks()
const MODULE_NUMBER_CHECKS = buildModuleNumberChecks()

export function validateSoftDriveXml(xmlString: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const parsed = parseXmlDocument(xmlString)
  if ('error' in parsed) {
    return { valid: false, errors: [`XML parse error: ${parsed.error}`], warnings }
  }

  const { doc } = parsed
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

  // Reject unreadable numbers rather than letting a misread value through. "1,5" would
  // otherwise become 1 and "12abc" would become 12 — both plausible-looking but wrong.
  for (const moduleCheck of MODULE_NUMBER_CHECKS) {
    const childSet = containerFor(located, moduleCheck.moduleKey)
    if (!childSet) continue

    for (const param of moduleCheck.params) {
      const raw = getRawValue(childSet, param.xmlName)
      if (raw === null || raw === '') continue

      if (parseParameterNumber(raw) === null) {
        errors.push(
          `${moduleCheck.moduleName}.${param.paramKey} is not a readable number: '${raw}'. ` +
          `Expected a plain decimal value such as 0.05 (a dot as decimal separator, no unit suffix).`
        )
      }
    }
  }

  // Validate enum values and detect Area usage
  for (const moduleCheck of MODULE_ENUM_CHECKS) {
    const childSet = containerFor(located, moduleCheck.moduleKey)
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

  // Area detection is advisory; suppress it when the file is being rejected anyway.
  return { valid: errors.length === 0, errors, warnings: errors.length > 0 ? [] : warnings }
}
