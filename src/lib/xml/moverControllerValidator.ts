import { MC_MODULE_TYPE_IDS } from '@/lib/constants/moverControllerTypes'
import type { McModuleKey } from '@/lib/constants/moverControllerTypes'
import { mcParameterMeta } from '@/lib/tmc/registry'
import { getEnumValue, getRawValue, parseParameterNumber, parseXmlDocument } from './locate'
import { locateMoverController } from './moverControllerLocate'
import type { ValidationResult } from './validator'

/** A MoverController parameter set is always saved as a TwinCAT system manager item. */
const SUPPORTED_ROOT = 'TcSmItem'

const MODULE_DISPLAY_NAMES: Record<McModuleKey, string> = {
  general: 'General',
  encoder: 'Encoder',
  positionControl: 'PositionControl',
  velocityControl: 'VelocityControl',
  filter: 'Filter',
  feedForward: 'FeedForward',
}

const MC_MODULE_KEYS = Object.keys(MODULE_DISPLAY_NAMES) as McModuleKey[]

/**
 * Checks a MoverController `.xti` the same way `validateSoftDriveXml` checks a source
 * file: the structure must be complete, every number must be readable and every enum
 * must be a value the driver knows. A misread value would otherwise show up as a
 * plausible-looking difference in the comparison.
 */
export function validateMoverControllerXti(xmlString: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const parsed = parseXmlDocument(xmlString)
  if ('error' in parsed) {
    return { valid: false, errors: [`XML parse error: ${parsed.error}`], warnings }
  }

  const { doc } = parsed
  const root = doc.documentElement
  if (root.tagName !== SUPPORTED_ROOT) {
    return {
      valid: false,
      errors: [`Expected root element '${SUPPORTED_ROOT}' (MoverController XTI), found '${root.tagName}'`],
      warnings,
    }
  }

  const located = locateMoverController(doc)
  if (!located) {
    return { valid: false, errors: ['No MoverController parameters found in the file'], warnings }
  }

  for (const key of MC_MODULE_KEYS) {
    if (!located.modules[key]) {
      errors.push(`Missing required module: ${MODULE_DISPLAY_NAMES[key]} (TypeId: ${MC_MODULE_TYPE_IDS[key]})`)
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  for (const key of MC_MODULE_KEYS) {
    const container = located.modules[key]
    const moduleName = MODULE_DISPLAY_NAMES[key]

    for (const [paramKey, meta] of Object.entries(mcParameterMeta()[key])) {
      if (meta.type === 'number') {
        const raw = getRawValue(container, meta.name)
        if (raw === null || raw === '') continue

        if (parseParameterNumber(raw) === null) {
          errors.push(
            `${moduleName}.${paramKey} is not a readable number: '${raw}'. ` +
            `Expected a plain decimal value such as 0.05 (a dot as decimal separator, no unit suffix).`
          )
        }
        continue
      }

      if (!meta.enumOptions) continue
      const value = getEnumValue(container, meta.name)
      if (value === null) continue

      if (!meta.enumOptions.includes(value)) {
        errors.push(
          `Invalid value '${value}' for ${moduleName}.${paramKey}. ` +
          `Valid values: ${meta.enumOptions.join(', ')}`
        )
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}
