/**
 * Derives the UI parameter metadata for one TMC version.
 *
 * The TMC is the authority for everything objective — unit, comment, enum members,
 * grouping, whether a value is numeric — but it knows nothing about this application:
 * which parameters are worth showing, what to call them, which ones the converter
 * transforms, and which ones only make sense for certain values of another parameter.
 * That knowledge lives in a hand-maintained overlay, and the two are merged here.
 *
 * The overlay is also the allowlist. A TMC parameter that is not named in it is not
 * shown, so a new driver version can never surface an unreviewed parameter on its own.
 */

import { normaliseGuid } from './tmc.mjs'

/** BOOL has no `<EnumInfo>` of its own, but is written as enum text in a parameter set. */
const BOOL_GUID = '18071995-0000-0000-0000-000000000030'
const BOOL_OPTIONS = ['FALSE', 'TRUE']

/**
 * The parameters of a module, keyed the way the overlay refers to them.
 *
 * A `<Parameter>` that declares its type inline contributes its `<SubItem>` members
 * rather than itself: on the SoftDrive side the entire filter parameter set is nested
 * inside a single `ConfigurationFilter` parameter, and those members are what the user
 * actually edits.
 */
export function collectParameterPool(module) {
  const pool = new Map()
  const ambiguous = new Set()

  // Entries are always reachable by their full path. The bare name is offered as a
  // convenience only while it stays unique — `Reserved` exists inside more than one
  // SoftDrive struct, and silently binding the overlay to whichever came first would
  // be worse than making it spell out the path.
  const add = (entry) => {
    pool.set(entry.path, entry)

    if (entry.key === entry.path) return
    if (ambiguous.has(entry.key)) return
    if (pool.has(entry.key)) {
      pool.delete(entry.key)
      ambiguous.add(entry.key)
      return
    }
    pool.set(entry.key, entry)
  }

  for (const parameter of module.parameters) {
    if (parameter.subItems.length > 0) {
      for (const item of parameter.subItems) {
        add({
          key: item.name,
          path: `${parameter.name}.${item.name}`,
          // Deliberately not inherited from the struct: `ConfigurationFilter` is
          // declared in Hz, but only its frequency members are measured in Hz.
          unit: item.unit,
          comment: item.comment,
          group: parameter.group,
          enumValues: item.enumValues,
          typeGuid: item.typeGuid,
          hidden: parameter.hidden,
          online: parameter.online,
        })
      }
      continue
    }

    add({
      key: parameter.name,
      path: parameter.name,
      unit: parameter.unit,
      comment: parameter.comment,
      group: parameter.group,
      enumValues: parameter.enumValues,
      typeGuid: parameter.baseTypeGuid,
      hidden: parameter.hidden,
      online: parameter.online,
    })
  }

  return pool
}

/** The enum members of an entry, whether declared inline or on the type it references. */
function enumOptionsOf(entry, dataTypes) {
  if (entry.enumValues) return entry.enumValues.map((member) => member.text)

  if (entry.typeGuid) {
    if (normaliseGuid(entry.typeGuid) === BOOL_GUID) return BOOL_OPTIONS
    const type = dataTypes.get(normaliseGuid(entry.typeGuid))
    if (type?.enumValues) return type.enumValues.map((member) => member.text)
  }

  return undefined
}

/**
 * Merges one TMC parameter with its overlay entry into the shape the UI consumes.
 *
 * Field order matches the hand-written tables this replaces, so the generated JSON
 * stays readable in a diff.
 */
function buildParameter(entry, overlay, dataTypes) {
  const enumOptions = overlay.enumOptions ?? enumOptionsOf(entry, dataTypes)

  const meta = {
    name: overlay.name ?? entry.key,
    displayName: overlay.displayName,
    unit: overlay.unit ?? entry.unit ?? '',
    type: overlay.type ?? (enumOptions ? 'enum' : 'number'),
  }

  if (meta.type === 'enum') {
    if (!enumOptions) {
      throw new Error(`Parameter '${entry.path}' is declared as an enum but has no members.`)
    }
    meta.enumOptions = enumOptions
  }

  if (overlay.converted) meta.converted = true
  if (overlay.renamedFrom) meta.renamedFrom = overlay.renamedFrom
  if (overlay.group ?? entry.group) meta.group = overlay.group ?? entry.group

  const comment = overlay.comment ?? entry.comment
  if (comment) meta.comment = comment

  if (overlay.dependsOn) meta.dependsOn = overlay.dependsOn

  return meta
}

/**
 * Builds the metadata for every module of one side (MoverController or SoftDrive) and
 * reports how the TMC has drifted away from the overlay.
 *
 * Drift is split by how dangerous it is. A parameter the overlay knows but the TMC no
 * longer has is an **error**: the converter references it by name, so the version
 * cannot be supported. A parameter the TMC gained is only a **warning** — it stays
 * hidden until someone adds it deliberately, which is the safe default.
 */
export function buildMeta(model, overlay) {
  const meta = {}
  const errors = []
  const warnings = []

  for (const module of overlay.modules) {
    const tmcModule = model.modules.get(normaliseGuid(module.tmcModuleGuid))
    if (!tmcModule) {
      errors.push(`Module '${module.key}' ({${module.tmcModuleGuid}}) is missing from the TMC.`)
      continue
    }

    const pool = collectParameterPool(tmcModule)
    const entries = {}

    for (const [key, parameterOverlay] of Object.entries(module.parameters)) {
      const entry = pool.get(key)

      // A few SoftDrive parameters appear in exported parameter sets and are read by
      // the importer, but are not declared in this TMC — they come from a different
      // SoftDrive build. The overlay has to describe them in full, and says so.
      if (!entry && parameterOverlay.notInTmc) {
        entries[key] = buildParameter({ key, path: key }, parameterOverlay, model.dataTypes)
        continue
      }

      if (!entry) {
        errors.push(
          `Parameter '${key}' of module '${module.key}' is no longer in the TMC ` +
          `(module '${tmcModule.name}'). The converter refers to it by name.`
        )
        continue
      }

      if (parameterOverlay.notInTmc) {
        warnings.push(
          `Parameter '${key}' of module '${module.key}' is marked notInTmc but the TMC now ` +
          `declares it; the marker and any hand-written metadata can be dropped.`
        )
      }

      entries[key] = buildParameter(entry, parameterOverlay, model.dataTypes)
    }

    // Everything the driver offers that the overlay does not mention. Hidden and
    // online parameters are infrastructure rather than tuning values, so reporting
    // them would bury the interesting cases.
    for (const [key, entry] of pool) {
      if (key in module.parameters || entry.hidden || entry.online) continue
      warnings.push(`Module '${module.key}' has a new parameter '${entry.path}' that the overlay does not list.`)
    }

    meta[module.key] = entries
  }

  // A dependency that names a value the enum no longer has would silently hide the
  // parameter it guards, which looks like the parameter having been removed.
  for (const module of overlay.modules) {
    for (const [key, parameter] of Object.entries(meta[module.key] ?? {})) {
      const dependency = parameter.dependsOn
      if (!dependency) continue

      const controller = meta[module.key]?.[dependency.paramKey]
      if (!controller) {
        errors.push(`'${module.key}.${key}' depends on '${dependency.paramKey}', which is not in the module.`)
        continue
      }

      const missing = dependency.values.filter((value) => !controller.enumOptions?.includes(value))
      if (missing.length > 0) {
        errors.push(
          `'${module.key}.${key}' depends on ${controller.name} values ${missing.join(', ')}, ` +
          `which the TMC no longer defines.`
        )
      }
    }
  }

  return { meta, errors, warnings }
}

/**
 * The module descriptors the UI renders, with each icon read out of the TMC that
 * declares it. `models` is keyed by side, because one SoftDrive module borrows its
 * icon from the MoverController TMC.
 */
export function buildModuleDescriptors(models, side, overlay) {
  return overlay.modules.map((module) => {
    const source = models[module.icon?.from ?? side]
    const iconModule = source?.modules.get(normaliseGuid(module.icon?.moduleGuid ?? module.tmcModuleGuid))
    const icon = iconModule ? /<ImageData>([0-9A-Fa-f]+)<\/ImageData>/.exec(iconModule.text) : null

    if (!icon) {
      throw new Error(`Module '${module.key}' has no <ImageData> in the TMC, so it would render without an icon.`)
    }

    return { key: module.key, label: module.label, iconHex: icon[1] }
  })
}
