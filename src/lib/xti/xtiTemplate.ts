import { activeTemplate } from '@/lib/tmc/registry'
import { XTS_DRIVER_VERSION } from '@/lib/constants/xtsVersion'

interface XtiParameterValues {
  general: string
  encoder: string
  positionControl: string
  velocityControl: string
  filter: string
  feedForward: string
}

export interface BuildXtiOptions {
  /** TcIoXts driver version the generated file targets. */
  driverVersion?: string
  /**
   * The template to fill in. Defaults to the one generated for the active driver
   * version; pass it explicitly only to render against a version other than the
   * selected one.
   */
  template?: string
}

const OPEN_TAG = '<ParameterValues>'
const CLOSE_TAG = '</ParameterValues>'

/** The template holds one main block plus the six sub-module blocks. */
const EXPECTED_SUB_BLOCKS = 6

/** Matches the driver version inside `ClassFactoryId="…|TcIoXts|4.4.22.0"`. */
const DRIVER_VERSION_PATTERN = /(\|TcIoXts\|)(\d+\.\d+\.\d+\.\d+)/g

/** A driver version must look like the four-part TwinCAT scheme. */
export function isValidDriverVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+\.\d+$/.test(version.trim())
}

/**
 * Replaces the 6 sub-module ParameterValues sections in the XTI template.
 * Skips the first (main module) ParameterValues block.
 */
export function buildXtiXml(values: XtiParameterValues, options: BuildXtiOptions = {}): string {
  // Only an omitted version falls back to the default. An explicitly passed one must be
  // valid, so a blank input field can never silently export the default version instead.
  const driverVersion = options.driverVersion === undefined
    ? XTS_DRIVER_VERSION
    : options.driverVersion.trim()

  if (!isValidDriverVersion(driverVersion)) {
    throw new Error(
      `Invalid TcIoXts driver version '${driverVersion}'. Expected four numbers, for example ${XTS_DRIVER_VERSION}.`
    )
  }

  const xml = (options.template ?? activeTemplate()).replace(/\r\n/g, '\n')

  const replacements = [
    values.general,
    values.encoder,
    values.positionControl,
    values.velocityControl,
    values.filter,
    values.feedForward,
  ]

  // Find all ParameterValues block positions
  const blocks: { openEnd: number; closeStart: number }[] = []
  let searchFrom = 0
  while (true) {
    const openIdx = xml.indexOf(OPEN_TAG, searchFrom)
    if (openIdx === -1) break
    const openEnd = openIdx + OPEN_TAG.length
    const closeIdx = xml.indexOf(CLOSE_TAG, openEnd)
    if (closeIdx === -1) break
    blocks.push({ openEnd, closeStart: closeIdx })
    searchFrom = closeIdx + CLOSE_TAG.length
  }

  // First block (index 0) is the main module — skip it.
  // Blocks 1–6 are the sub-modules to replace.
  const subBlocks = blocks.slice(1)

  // Returning the untouched template here would hand the user a file full of
  // Beckhoff defaults that looks exactly like a successful conversion. A migration
  // tool must never produce silently wrong output, so this is fatal.
  if (subBlocks.length !== EXPECTED_SUB_BLOCKS) {
    throw new Error(
      `XTI template is malformed: expected ${EXPECTED_SUB_BLOCKS} sub-module ParameterValues ` +
      `blocks, found ${subBlocks.length}. Refusing to export a parameter set that would ` +
      `contain default values instead of the converted ones.`
    )
  }

  // Build result by splicing: keep everything outside the sub-module content,
  // replace the content inside each sub-module ParameterValues block.
  let result = ''
  let pos = 0
  for (let i = 0; i < subBlocks.length; i++) {
    const { openEnd, closeStart } = subBlocks[i]
    result += xml.slice(pos, openEnd)
    result += '\n' + replacements[i] + '\n'
    pos = closeStart
  }
  result += xml.slice(pos)

  result = result.replace(DRIVER_VERSION_PATTERN, `$1${driverVersion}`)

  return result.replace(/\n/g, '\r\n')
}
