import templateXml from './template.xti?raw'

interface XtiParameterValues {
  general: string
  encoder: string
  positionControl: string
  velocityControl: string
  filter: string
  feedForward: string
}

const OPEN_TAG = '<ParameterValues>'
const CLOSE_TAG = '</ParameterValues>'

/**
 * Replaces the 6 sub-module ParameterValues sections in the XTI template.
 * Skips the first (main module) ParameterValues block.
 */
export function buildXtiXml(values: XtiParameterValues): string {
  const xml = templateXml.replace(/\r\n/g, '\n')

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

  if (subBlocks.length !== 6) {
    console.warn(`XTI template: expected 6 sub-module ParameterValues blocks, found ${subBlocks.length}`)
    return xml.replace(/\n/g, '\r\n')
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

  return result.replace(/\n/g, '\r\n')
}
