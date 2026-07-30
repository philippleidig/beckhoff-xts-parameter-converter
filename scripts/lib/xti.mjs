/**
 * Renders the XTI parameter set template for a given TcIoXts version from its `.tmc`.
 *
 * TwinCAT's own export is the reference: `renderXtiTemplate()` applied to the 4.4.22.0
 * TMC reproduces `src/lib/xti/template.xti` byte for byte, and a test holds it to that.
 * Every transformation below was derived from diffing the two, not from documentation.
 *
 * The work is deliberately done on the TMC's raw text rather than on a parsed tree:
 * the output has to match a TwinCAT-written file exactly, and any parse-and-serialise
 * round trip would quietly renormalise attribute order, empty elements and CDATA.
 */

import {
  collectDataTypeClosure,
  isPrimitiveGuid,
  normaliseGuid,
  resolveBitSize,
  resolveDefaultEnumText,
} from './tmc.mjs'

/** The configuration TwinCAT offers as "XTS Mover Parameter Set". */
const CONFIGURATION_NAME = 'StandardParameterSet'

/** Element ids count up from the root in steps of 0x10, following the OTCID order. */
const MODULE_ID_BASE = 0x01010000
const MODULE_ID_STEP = 0x10

/** Image ids run 1000…1006, one per module, in OTCID order. */
const IMAGE_ID_BASE = 999

/**
 * Empty elements the TMC carries but a TwinCAT XTI export leaves out. They are dropped
 * only when self-closing — a populated `<DataAreas>` would be real content.
 */
const DROPPED_EMPTY_ELEMENTS = [
  'Licenses',
  'DataAreas',
  'InterfacePointers',
  'DataPointers',
  'EventMessages',
  'EventClasses',
]

/**
 * The order TwinCAT writes attributes in, which the TMC does not follow consistently —
 * it has both `Min="1" Max="1000"` and `Max="500" Min="1"`. Attributes not listed keep
 * their relative order and follow the listed ones.
 */
const ATTRIBUTE_ORDER = {
  Parameter: ['OnlineParameter', 'CreateSymbol', 'HideParameter', 'ReadOnly', 'Group'],
  Elements: ['Min', 'Max', 'MaxUnbounded'],
}

/** The name TwinCAT gives a freshly inserted parameter set object. */
const ROOT_OBJECT_NAME = `Object1 (${CONFIGURATION_NAME})`

const indent = (depth) => '\t'.repeat(depth)

/** Uppercases every braced GUID. Idempotent, so blocks that are already uppercase pass through. */
function upperCaseGuids(text) {
  return text.replace(/\{[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\}/g, (guid) => guid.toUpperCase())
}

function wrapCdata(text) {
  return `<![CDATA[${text}]]>`
}

/**
 * Renders a TMC default as the plain decimal TwinCAT writes: `10000.0` becomes `10000`,
 * `#x00000000` becomes `0`, `0.5` stays `0.5`. Anything unparseable is passed through
 * untouched rather than being turned into `NaN`.
 */
function normaliseNumber(raw) {
  const hex = /^#x([0-9a-fA-F]+)$/.exec(raw)
  if (hex) return String(Number.parseInt(hex[1], 16))

  const value = Number(raw)
  return Number.isFinite(value) ? String(value) : raw
}

/**
 * Splits a block into lines and rewrites the leading whitespace from the TMC's
 * two-space steps to tabs, anchored so the block's own opening tag sits at `baseDepth`.
 */
function reindent(blockText, baseDepth) {
  const lines = blockText.split('\n')
  if (lines.length === 1) return [`${indent(baseDepth)}${lines[0].trim()}`]

  // The slice begins at the opening tag, so its own indentation is gone. The closing
  // tag still carries it, which makes it the reference point for everything between.
  const last = lines[lines.length - 1]
  const blockIndent = last.length - last.trimStart().length

  return lines.map((line, index) => {
    const content = line.trim()
    if (content.length === 0) return ''
    if (index === 0) return `${indent(baseDepth)}${content}`
    const spaces = line.length - line.trimStart().length
    const depth = Math.max(0, Math.round((spaces - blockIndent) / 2))
    return `${indent(baseDepth + depth)}${content}`
  })
}

function isDroppedEmptyElement(line) {
  return DROPPED_EMPTY_ELEMENTS.some((name) => new RegExp(`^<${name}\\s*/>$`).test(line.trim()))
}

/** Puts an element's attributes into the order a TwinCAT export writes them. */
function reorderAttributes(line) {
  const match = /^(\s*)<(\w+)(\s[^>]*?)>((?:[^<]*<\/\2>)?)$/.exec(line)
  if (!match) return line

  const [, leading, tag, rawAttrs, tail] = match
  const order = ATTRIBUTE_ORDER[tag]
  if (!order) return line

  const attributes = [...rawAttrs.matchAll(/(\w+)="([^"]*)"/g)].map(([, name, value]) => ({ name, value }))
  const known = order.map((name) => attributes.find((a) => a.name === name)).filter(Boolean)
  const rest = attributes.filter((a) => !order.includes(a.name))
  const rendered = [...known, ...rest].map((a) => ` ${a.name}="${a.value}"`).join('')

  return `${leading}<${tag}${rendered}>${tail}`
}

/**
 * Rewrites a `<BaseType>` reference: an XTI states the referenced type's `<BitSize>`
 * just before it and names its namespace, both of which the TMC leaves implicit.
 *
 * Only `<BaseType>` is treated this way. A `<Type>` element also appears under
 * `<Interfaces>` (referring to `ITComObject`, which has no bit size) and under
 * `<SubItem>`, where the size follows rather than precedes it — see
 * {@link renderDataType}.
 */
function expandBaseType(line, model) {
  const match = /^(\s*)<BaseType([^>]*)>([^<]*)<\/BaseType>$/.exec(line)
  if (!match) return [line]

  const [, leading, rawAttrs, typeName] = match
  const guidMatch = /GUID="\{([0-9a-fA-F-]+)\}"/.exec(rawAttrs)
  if (!guidMatch) return [line]

  const guid = normaliseGuid(guidMatch[1])
  const referenced = model.dataTypes.get(guid)

  let attrs = rawAttrs
  if (!isPrimitiveGuid(guid) && referenced?.namespace && !/Namespace="/.test(attrs)) {
    attrs = `${attrs} Namespace="${referenced.namespace}"`
  }

  return [
    `${leading}<BitSize>${resolveBitSize(guid, model.dataTypes)}</BitSize>`,
    `${leading}<BaseType${attrs}>${typeName}</BaseType>`,
  ]
}

/**
 * Applies the rewrites that are identical for data type and module blocks.
 *
 * `expandBaseTypes` is on for module blocks, where every parameter's `<BaseType>` is
 * preceded by the referenced type's size. Inside a `<DataType>` the size is stated once
 * after `<Name>` instead, so expanding there would emit it twice.
 */
function applyCommonRules(lines, model, { expandBaseTypes = false } = {}) {
  const out = []

  for (const line of lines) {
    if (isDroppedEmptyElement(line)) continue

    // `Collapsed="false"` is the default and is left out; `Collapsed="true"` is kept.
    const groupMatch = /^(\s*)<Group( Collapsed="([^"]*)")?>([^<]*)<\/Group>$/.exec(line)
    if (groupMatch) {
      const [, leading, , collapsed, label] = groupMatch
      const attrs = collapsed === 'true' ? ' Collapsed="true"' : ''
      out.push(`${leading}<Group${attrs}>${wrapCdata(label)}</Group>`)
      continue
    }

    const unitMatch = /^(\s*)<Unit>((?:(?!<!\[CDATA\[)[^<])*)<\/Unit>$/.exec(line)
    if (unitMatch) {
      out.push(`${unitMatch[1]}<Unit>${wrapCdata(unitMatch[2])}</Unit>`)
      continue
    }

    const cdataMatch = /^(\s*)<(Text|Comment)>((?:(?!<!\[CDATA\[)[^<])*)<\/\2>$/.exec(line)
    if (cdataMatch) {
      out.push(`${cdataMatch[1]}<${cdataMatch[2]}>${wrapCdata(cdataMatch[3])}</${cdataMatch[2]}>`)
      continue
    }

    // TwinCAT writes empty elements without the space the TMC puts before the slash,
    // and expands an empty <Type> into a tag pair because the element carries text.
    const emptyMatch = /^(\s*)<(\w+)((?:\s[^>]*?)?)\s*\/>$/.exec(upperCaseGuids(line))
    if (emptyMatch) {
      const [, leading, tag, attrs] = emptyMatch
      out.push(tag === 'Type' ? `${leading}<Type${attrs}></Type>` : `${leading}<${tag}${attrs}/>`)
      continue
    }

    const imageMatch = /^(\s*)<ImageData>([0-9A-Fa-f]+)<\/ImageData>$/.exec(line)
    if (imageMatch) {
      out.push(`${imageMatch[1]}<ImageData>${imageMatch[2].toLowerCase()}</ImageData>`)
      continue
    }

    const ptcidMatch = /^(\s*)<PTCID>#x([0-9A-Fa-f]+)<\/PTCID>$/.exec(line)
    if (ptcidMatch) {
      out.push(`${ptcidMatch[1]}<PTCID>#x${ptcidMatch[2].toLowerCase()}</PTCID>`)
      continue
    }

    const rewritten = reorderAttributes(upperCaseGuids(line))
    out.push(...(expandBaseTypes ? expandBaseType(rewritten, model) : [rewritten]))
  }

  return out
}

/**
 * Renders one `<DataType>` for the XTI header.
 *
 * Beyond the common rules this adds the type's own `<BitSize>` after `<Name>`, and the
 * `<BitOffs>` of each `<SubItem>` — both implicit in the TMC and explicit in an XTI.
 */
function renderDataType(type, model, depth) {
  const lines = applyCommonRules(reindent(type.text, depth), model)
  const out = []
  let nameSeen = false
  let inSubItem = false
  let subItemOffset = 0

  for (const line of lines) {
    if (/^\s*<SubItem>$/.test(line)) inSubItem = true
    if (/^\s*<\/SubItem>$/.test(line)) inSubItem = false

    out.push(line)

    // The type's own size follows its <Name>, which is the first one in the block —
    // later <Name> elements belong to nested <Property> entries.
    if (!nameSeen && /^\s*<Name[\s>]/.test(line)) {
      nameSeen = true
      if (type.bitSize === undefined) {
        const leading = line.slice(0, line.length - line.trimStart().length)
        out.push(`${leading}<BitSize>${resolveBitSize(type.guid, model.dataTypes)}</BitSize>`)
      }
      continue
    }

    // A struct member states its size and offset *after* its <Type>, unlike a
    // <BaseType>, where the size comes first. A <Type> outside a <SubItem> is an
    // interface or relation reference and gets neither.
    const subItemType = inSubItem && /^(\s*)<Type[^>]*GUID="\{([0-9A-Fa-f-]+)\}"[^>]*>[^<]/.exec(line)
    if (subItemType) {
      const memberSize = resolveBitSize(subItemType[2], model.dataTypes)
      out.push(`${subItemType[1]}<BitSize>${memberSize}</BitSize>`)
      out.push(`${subItemType[1]}<BitOffs>${subItemOffset}</BitOffs>`)
      subItemOffset += memberSize
    }
  }

  return out
}

/**
 * The `<Value>` entries TwinCAT writes into a module's `<ParameterValues>`: every
 * parameter that is stored in the file (not read back online) and has a default.
 * That is why `ModuleId` appears while `Version` and `VersionString` do not.
 */
function renderParameterValues(module, model, depth, wiring) {
  const out = [`${indent(depth)}<ParameterValues>`]

  for (const parameter of module.parameters) {
    if (parameter.online || !parameter.default) continue

    const type = parameter.baseTypeGuid ? model.dataTypes.get(parameter.baseTypeGuid) : undefined

    // An array parameter is written per element. Every parameter set the configuration
    // declares holds exactly one, so only index 0 is emitted.
    const name = parameter.isArray ? `${parameter.name}[0]` : parameter.name

    out.push(`${indent(depth + 1)}<Value>`)
    out.push(`${indent(depth + 2)}<Name>${name}</Name>`)

    // A parameter typed as an OTCID reference defaults to a null id in the TMC. In an
    // exported parameter set it points at the child module that provides that category.
    const wired = type?.categoryOid !== undefined ? wiring.get(type.categoryOid) : undefined

    if (wired !== undefined) {
      out.push(`${indent(depth + 2)}<Value>${wired}</Value>`)
    } else if (parameter.default.enumText !== undefined) {
      out.push(`${indent(depth + 2)}<EnumText>${resolveDefaultEnumText(parameter, type)}</EnumText>`)
    } else if (parameter.default.data !== undefined) {
      out.push(`${indent(depth + 2)}<Data>${parameter.default.data}</Data>`)
    } else if (parameter.default.value !== undefined) {
      out.push(`${indent(depth + 2)}<Value>${normaliseNumber(parameter.default.value)}</Value>`)
    } else {
      throw new Error(
        `Parameter '${parameter.name}' of module '${module.name}' has a <Default> with no ` +
        `<EnumText>, <Data> or <Value>, so no parameter value can be written for it.`
      )
    }

    out.push(`${indent(depth + 1)}</Value>`)
  }

  out.push(`${indent(depth)}</ParameterValues>`)
  return out
}

/**
 * Turns a TMC `<Module>` into the XTI's `<TmcDesc>`: the same content, rewritten by the
 * common rules, with the parent reference and the default parameter values appended.
 */
function renderTmcDesc(module, model, entry, classFactoryId, depth, wiring) {
  const lines = applyCommonRules(reindent(module.text, depth), model, { expandBaseTypes: true })

  const head = lines[0].replace(
    /^(\s*)<Module GUID="([^"]+)"[^>]*>$/,
    (_, leading, guid) => `${leading}<TmcDesc GUID="${guid}" ClassFactoryId="${classFactoryId}">`
  )
  const body = lines.slice(1, -1)

  const tail = []
  if (entry.parentOtcid !== undefined) {
    tail.push(`${indent(depth + 1)}<ParentOTCID>${formatModuleId(entry.parentOtcid)}</ParentOTCID>`)
  }
  tail.push(...renderParameterValues(module, model, depth + 1, wiring))
  tail.push(`${indent(depth)}</TmcDesc>`)

  return [head, ...body, ...tail]
}

function formatModuleId(otcid) {
  return `#x${(MODULE_ID_BASE + otcid * MODULE_ID_STEP).toString(16).padStart(8, '0')}`
}

/** Renders a module element and, for the root, nests its children inside it. */
function renderModule(entry, children, model, classFactoryId, depth, wiring) {
  const module = model.modules.get(normaliseGuid(entry.clsid))
  if (!module) throw new Error(`TMC has no module ${entry.clsid} ('${entry.name}').`)

  const isRoot = entry.parentOtcid === undefined
  const attributes = [
    isRoot ? '' : ' SaveInOwnFile="true"',
    ` Id="${formatModuleId(entry.otcid)}"`,
    ' KeepUnrestoredLinks="2"',
    ` ClassFactoryId="${classFactoryId}"`,
  ].join('')

  return [
    `${indent(depth)}<Module${attributes}>`,
    `${indent(depth + 1)}<Name>${isRoot ? ROOT_OBJECT_NAME : entry.name}</Name>`,
    `${indent(depth + 1)}<ImageId>${IMAGE_ID_BASE + entry.otcid}</ImageId>`,
    ...renderTmcDesc(module, model, entry, classFactoryId, depth + 1, wiring),
    ...children,
    `${indent(depth)}</Module>`,
  ]
}

/**
 * Renders the complete XTI template for the parameter set configuration described by
 * `model`.
 *
 * `twinCatVersion` is not derivable from the TMC — it records the TwinCAT XAE build
 * that wrote the file and only appears in the root element.
 */
export function renderXtiTemplate(model, { twinCatVersion }) {
  const configuration = model.configurations.find((entry) => entry.name === CONFIGURATION_NAME)
  if (!configuration) {
    throw new Error(
      `TMC has no <Configuration> named '${CONFIGURATION_NAME}'. ` +
      `Found: ${model.configurations.map((c) => c.name).join(', ') || '(none)'}.`
    )
  }

  const classFactoryId = `Beckhoff Automation GmbH|${model.library.name}|${model.library.version}`
  const entries = [...configuration.modules].sort((a, b) => a.otcid - b.otcid)
  const root = entries.find((entry) => entry.parentOtcid === undefined)
  if (!root) throw new Error(`Configuration '${CONFIGURATION_NAME}' has no root module.`)

  const dataTypes = collectDataTypeClosure(model, entries.map((entry) => entry.clsid))

  // Maps each module's category name to its element id, so the root module's OTCID
  // parameters can be pointed at the children that provide them.
  const wiring = new Map(
    entries.map((entry) => [
      model.modules.get(normaliseGuid(entry.clsid))?.name,
      MODULE_ID_BASE + entry.otcid * MODULE_ID_STEP,
    ])
  )

  const lines = [
    '<?xml version="1.0"?>',
    '<TcSmItem xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
      'xsi:noNamespaceSchemaLocation="http://www.beckhoff.com/schemas/2012/07/TcSmProject" ' +
      `TcSmVersion="1.0" TcVersion="${twinCatVersion}" ClassName="CTComObjDef">`,
    `${indent(1)}<DataTypes>`,
    ...dataTypes.flatMap((type) => renderDataType(type, model, 2)),
    `${indent(1)}</DataTypes>`,
    `${indent(1)}<ImageDatas>`,
    ...entries.map((entry) => {
      const module = model.modules.get(normaliseGuid(entry.clsid))
      const image = /<ImageData>([0-9A-Fa-f]+)<\/ImageData>/.exec(module.text)
      if (!image) throw new Error(`Module '${entry.name}' has no <ImageData>.`)
      return `${indent(2)}<ImageData Id="${IMAGE_ID_BASE + entry.otcid}">${image[1].toLowerCase()}</ImageData>`
    }),
    `${indent(1)}</ImageDatas>`,
    ...renderModule(
      root,
      entries
        .filter((entry) => entry.parentOtcid !== undefined)
        .flatMap((entry) => renderModule(entry, [], model, classFactoryId, 2, wiring)),
      model,
      classFactoryId,
      1,
      wiring
    ),
    '</TcSmItem>',
    '',
  ]

  return lines.join('\n')
}
