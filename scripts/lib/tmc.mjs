/**
 * Reader for TwinCAT module class files (`.tmc`).
 *
 * The XTI generator needs two different views of the same file, which is why this
 * module offers both:
 *
 * - **Raw text slices** of `<Module>` and `<DataType>` blocks. The generated XTI must
 *   match TwinCAT's own export byte for byte, and parsing into a DOM and serialising
 *   back would silently normalise attribute order, self-closing tags and CDATA. The
 *   TMC → XTI difference is a short list of line-oriented rewrites, so the text is
 *   kept and rewritten in place.
 * - **A resolved index** of data types, used for lookups the raw text cannot answer
 *   on its own — above all `<BitSize>`, which the XTI states explicitly but the TMC
 *   mostly leaves implicit.
 */

/** TwinCAT's built-in scalar types all share this GUID prefix. */
const PRIMITIVE_GUID_PREFIX = '18071995'

/**
 * Bit sizes of the built-in scalar types.
 *
 * These are *not* declared in the TMC — only the `STRING(n)` variants are, and those
 * resolve through the normal data type index. The GUIDs are stable across TwinCAT
 * versions, so a fixed table is correct here. Anything not listed raises rather than
 * defaulting, because a wrong `<BitSize>` produces an XTI that TwinCAT accepts and
 * then misreads.
 */
const PRIMITIVE_BIT_SIZES = new Map([
  ['18071995-0000-0000-0000-000000000005', 16], // INT
  ['18071995-0000-0000-0000-000000000008', 32], // UDINT
  ['18071995-0000-0000-0000-00000000000E', 64], // LREAL
  ['18071995-0000-0000-0000-00000000000F', 32], // OTCID
  ['18071995-0000-0000-0000-000000000021', 128], // GUID
  ['18071995-0000-0000-0000-000000000030', 8], // BOOL
])

export function isPrimitiveGuid(guid) {
  return normaliseGuid(guid).startsWith(PRIMITIVE_GUID_PREFIX)
}

/** Uppercases a GUID and strips the surrounding braces, so it can be used as a map key. */
export function normaliseGuid(guid) {
  return guid.replace(/[{}]/g, '').toUpperCase()
}

export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Finds every `<tag …>…</tag>` block at any depth, tracking nesting so that a block
 * containing a same-named child is returned as one span rather than being cut short.
 *
 * Returns outermost blocks only — the TMC nests `<Module>` inside `<Configuration>`,
 * and both the module registry and the configuration tree need to be read without
 * one swallowing the other.
 */
export function scanElements(text, tagName) {
  const token = new RegExp(`<(/?)${tagName}(\\s[^>]*?)?(/?)>`, 'g')
  const blocks = []
  let depth = 0
  let start = -1
  let openTag = ''
  let attrs = ''

  for (let match = token.exec(text); match !== null; match = token.exec(text)) {
    const [full, closing, rawAttrs, selfClosing] = match

    if (closing) {
      depth -= 1
      if (depth === 0) {
        blocks.push({ start, end: match.index + full.length, attrs, openTag })
        start = -1
      }
      continue
    }

    if (selfClosing) {
      if (depth === 0) {
        blocks.push({ start: match.index, end: match.index + full.length, attrs: rawAttrs ?? '', openTag: full })
      }
      continue
    }

    if (depth === 0) {
      start = match.index
      openTag = full
      attrs = rawAttrs ?? ''
    }
    depth += 1
  }

  return blocks.map((block) => ({ ...block, text: text.slice(block.start, block.end) }))
}

function attr(attrs, name) {
  const match = new RegExp(`${name}="([^"]*)"`).exec(attrs)
  return match ? match[1] : undefined
}

/** Reads the text of the first `<tag>` directly, without descending into children. */
function firstTagText(block, tagName) {
  const match = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`).exec(block)
  if (!match) return undefined
  return unwrapCdata(match[1])
}

function unwrapCdata(text) {
  const match = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(text.trim())
  return match ? match[1] : text
}

/**
 * The `<Library>` element carries the version the whole file describes. `TcIoXts.tmc`
 * puts it at the very end, `TcSoftDrive.tmc` near the top, so it is located by name
 * rather than by position.
 */
export function parseLibrary(text) {
  const block = /<Library>([\s\S]*?)<\/Library>/.exec(text)
  if (!block) throw new Error('TMC has no <Library> element, so its version cannot be determined.')
  const name = firstTagText(block[0], 'Name')
  const version = firstTagText(block[0], 'Version')
  if (!name || !version) throw new Error('TMC <Library> element is missing <Name> or <Version>.')
  return { name, version }
}

/**
 * Indexes every `<DataType>` by GUID.
 *
 * `bitSize` is left `undefined` where the TMC omits it; use {@link resolveBitSize},
 * which walks the base type chain to fill it in.
 */
export function parseDataTypes(text) {
  const types = new Map()

  for (const block of scanElements(text, 'DataType')) {
    const nameMatch = /<Name([^>]*)>([\s\S]*?)<\/Name>/.exec(block.text)
    if (!nameMatch) continue
    const guidRaw = attr(nameMatch[1], 'GUID')
    if (!guidRaw) continue

    const baseTypeMatch = /<BaseType([^>]*)>([^<]*)<\/BaseType>/.exec(block.text)
    const bitSizeMatch = /<BitSize>(\d+)<\/BitSize>/.exec(block.text)

    const enumValues = [...block.text.matchAll(/<EnumInfo>([\s\S]*?)<\/EnumInfo>/g)].map((info) => ({
      text: unwrapCdata(/<Text>([\s\S]*?)<\/Text>/.exec(info[1])?.[1] ?? ''),
      value: Number(/<Enum>(-?\d+)<\/Enum>/.exec(info[1])?.[1] ?? Number.NaN),
    }))

    const subItems = [...block.text.matchAll(/<SubItem>([\s\S]*?)<\/SubItem>/g)].map((item) => ({
      name: firstTagText(item[1], 'Name'),
      typeGuid: /<Type([^>]*)>/.exec(item[1]) ? attr(/<Type([^>]*)>/.exec(item[1])[1], 'GUID') : undefined,
      bitSize: /<BitSize>(\d+)<\/BitSize>/.exec(item[1])?.[1],
    }))

    // An OTCID type names the module category it points at, which is how the root
    // module's parameters are wired to their child modules in an XTI.
    const category = /<Property>\s*<Name>TcCategoryOID<\/Name>\s*<Value>([^<]+)<\/Value>/.exec(block.text)

    const guid = normaliseGuid(guidRaw)
    types.set(guid, {
      guid,
      name: unwrapCdata(nameMatch[2]),
      categoryOid: category?.[1],
      namespace: attr(nameMatch[1], 'Namespace'),
      cName: attr(nameMatch[1], 'CName'),
      bitSize: bitSizeMatch ? Number(bitSizeMatch[1]) : undefined,
      baseTypeGuid: baseTypeMatch ? normaliseGuid(attr(baseTypeMatch[1], 'GUID') ?? '') : undefined,
      baseTypeName: baseTypeMatch ? baseTypeMatch[2] : undefined,
      enumValues: enumValues.length > 0 ? enumValues : undefined,
      defaultEnumText: firstTagText(
        /<Default>[\s\S]*?<\/Default>/.exec(block.text)?.[0] ?? '',
        'EnumText'
      ),
      subItems,
      text: block.text,
      start: block.start,
    })
  }

  return types
}

/**
 * Determines a type's bit size, which the TMC states for only a minority of its types.
 *
 * Resolution order: an explicit `<BitSize>`, then the built-in table for primitives,
 * then the sum of `<SubItem>` sizes for structures, then the base type it derives from.
 * Throws rather than guessing — see {@link PRIMITIVE_BIT_SIZES}.
 */
export function resolveBitSize(guid, types, seen = new Set()) {
  const key = normaliseGuid(guid)

  const type = types.get(key)
  if (type?.bitSize !== undefined) return type.bitSize

  const primitive = PRIMITIVE_BIT_SIZES.get(key)
  if (primitive !== undefined) return primitive

  if (!type) {
    throw new Error(
      `Cannot determine the bit size of {${key}}: it is neither declared in the TMC nor a known ` +
      `built-in type. Add it to PRIMITIVE_BIT_SIZES in scripts/lib/tmc.mjs once its size is confirmed.`
    )
  }

  if (seen.has(key)) {
    throw new Error(`Data type {${key}} (${type.name}) refers to itself while resolving its bit size.`)
  }
  seen.add(key)

  if (type.subItems.length > 0) {
    return type.subItems.reduce(
      (sum, item) =>
        sum + (item.bitSize !== undefined ? Number(item.bitSize) : resolveBitSize(item.typeGuid, types, seen)),
      0
    )
  }

  if (type.baseTypeGuid) return resolveBitSize(type.baseTypeGuid, types, seen)

  throw new Error(`Data type {${key}} (${type.name}) has neither a bit size, sub items nor a base type.`)
}

/**
 * Reads the `<Modules>` registry: the full definition of each module including its
 * parameters. Only `<Module>` elements carrying a GUID are returned, which excludes
 * the short references inside `<Configurations>`.
 */
export function parseModules(text) {
  const modules = new Map()

  for (const block of scanElements(text, 'Module')) {
    const guidRaw = attr(block.attrs, 'GUID')
    if (!guidRaw) continue

    const guid = normaliseGuid(guidRaw)
    modules.set(guid, {
      guid,
      name: firstTagText(block.text, 'Name'),
      clsid: /<CLSID[^>]*>([^<]+)<\/CLSID>/.exec(block.text)?.[1],
      parameters: parseParameters(block.text),
      text: block.text,
      start: block.start,
    })
  }

  return modules
}

function parseParameters(moduleText) {
  const parametersBlock = /<Parameters>([\s\S]*?)<\/Parameters>/.exec(moduleText)
  if (!parametersBlock) return []

  return scanElements(parametersBlock[1], 'Parameter').map((block) => {
    const baseTypeMatch = /<BaseType([^>]*)>([^<]*)<\/BaseType>/.exec(block.text)
    const defaultBlock = /<Default>[\s\S]*?<\/Default>/.exec(block.text)?.[0]

    return {
      name: firstTagText(block.text, 'Name'),
      comment: firstTagText(block.text, 'Comment'),
      unit: firstTagText(block.text, 'Unit'),
      group: attr(block.attrs, 'Group'),
      baseTypeGuid: baseTypeMatch ? normaliseGuid(attr(baseTypeMatch[1], 'GUID') ?? '') : undefined,
      baseTypeName: baseTypeMatch?.[2],
      isArray: /<Elements[\s>]/.test(block.text),
      hidden: /HideParameter="true"/i.test(block.attrs),
      readOnly: /ReadOnly="true"/i.test(block.attrs),
      online: /OnlineParameter="true"/i.test(block.attrs),
      createSymbol: /CreateSymbol="true"/i.test(block.attrs),
      default: defaultBlock
        ? {
            enumText: firstTagText(defaultBlock, 'EnumText'),
            data: firstTagText(defaultBlock, 'Data'),
            value: firstTagText(defaultBlock, 'Value'),
            min: firstTagText(defaultBlock, 'Min'),
            max: firstTagText(defaultBlock, 'Max'),
          }
        : undefined,
      ptcid: firstTagText(block.text, 'PTCID'),
      text: block.text,
    }
  })
}

/**
 * Reads `<Configurations>`, which holds the authoritative module tree: names, class
 * ids and the OTCID numbering the XTI's element ids are derived from.
 */
export function parseConfigurations(text) {
  const configurationsBlock = /<Configurations>[\s\S]*<\/Configurations>/.exec(text)
  if (!configurationsBlock) return []

  return scanElements(configurationsBlock[0], 'Configuration').map((block) => ({
    name: firstTagText(block.text, 'Name'),
    guid: attr(block.attrs, 'GUID'),
    modules: scanElements(block.text, 'Module').map((entry) => ({
      name: firstTagText(entry.text, 'Name'),
      clsid: firstTagText(entry.text, 'CLSID'),
      otcid: Number(firstTagText(entry.text, 'OTCID')),
      parentOtcid: firstTagText(entry.text, 'ParentOTCID')
        ? Number(firstTagText(entry.text, 'ParentOTCID'))
        : undefined,
    })),
  }))
}

/**
 * Converts a class id to the byte order TwinCAT writes into a `ModuleId` parameter:
 * the first three GUID groups are little-endian, the rest stays as it is.
 *
 * `{98bec76d-d436-4208-9f8b-486be57865bd}` becomes `6dc7be9836d408429f8b486be57865bd`.
 */
export function moduleIdFromClsid(clsid) {
  const hex = normaliseGuid(clsid).replace(/-/g, '').toLowerCase()
  if (hex.length !== 32) throw new Error(`'${clsid}' is not a GUID.`)

  const swap = (part) => (part.match(/../g) ?? []).reverse().join('')
  return swap(hex.slice(0, 8)) + swap(hex.slice(8, 12)) + swap(hex.slice(12, 16)) + hex.slice(16)
}

/**
 * The enum member a parameter defaults to.
 *
 * A parameter's own `<Default><EnumText>` is sometimes an alias that is not a member of
 * the referenced enum — `MoverControllerOperationMode` defaults to `CSP`, which is not
 * one of its four `<EnumInfo>` texts. TwinCAT then falls back to the data type's own
 * default, which is how the exported XTI ends up saying `CyclicSynchronousPosition`.
 */
export function resolveDefaultEnumText(parameter, type) {
  const own = parameter.default?.enumText
  const members = type?.enumValues?.map((entry) => entry.text)

  if (own !== undefined && (!members || members.includes(own))) return own
  if (type?.defaultEnumText !== undefined) return type.defaultEnumText
  if (own !== undefined) return own

  throw new Error(
    `Parameter '${parameter.name}' has no resolvable default: neither it nor its type ` +
    `${type ? `'${type.name}'` : '(unknown)'} declares an <EnumText>.`
  )
}

/** Parses a TMC into the model the generators work on. */
export function parseTmc(rawText) {
  const text = stripBom(rawText)
  return {
    text,
    library: parseLibrary(text),
    dataTypes: parseDataTypes(text),
    modules: parseModules(text),
    configurations: parseConfigurations(text),
  }
}

/**
 * Every non-primitive data type the given modules reach, in the order they are first
 * referenced while walking the modules in the given order and their parameters in
 * declaration order. The XTI header lists exactly this set, in exactly this order —
 * which is *not* the order the TMC declares them in.
 */
export function collectDataTypeClosure(model, moduleGuids) {
  const found = new Map()

  const visit = (guid) => {
    const key = normaliseGuid(guid)
    if (isPrimitiveGuid(key) || found.has(key)) return
    const type = model.dataTypes.get(key)
    if (!type) return
    found.set(key, type)
    for (const item of type.subItems) if (item.typeGuid) visit(item.typeGuid)
    if (type.baseTypeGuid) visit(type.baseTypeGuid)
  }

  for (const guid of moduleGuids) {
    const module = model.modules.get(normaliseGuid(guid))
    if (!module) throw new Error(`TMC has no module {${normaliseGuid(guid)}}.`)
    for (const parameter of module.parameters) {
      if (parameter.baseTypeGuid) visit(parameter.baseTypeGuid)
    }
  }

  return [...found.values()]
}
