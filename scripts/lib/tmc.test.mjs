import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readTmc } from './store.mjs'
import {
  collectDataTypeClosure,
  moduleIdFromClsid,
  parseTmc,
  resolveBitSize,
  resolveDefaultEnumText,
  scanElements,
  stripBom,
} from './tmc.mjs'

/** The version the repository was seeded with; the reference for every gate here. */
const SEEDED_VERSION = '4.4.22.0'

/** The vendor TMCs live in the version store, gzipped, rather than loose in the tree. */
const readVendorTmc = (fileName) => readTmc(resolve(process.cwd()), SEEDED_VERSION, fileName)

describe('scanElements', () => {
  it('returns the outermost block when the same tag is nested', () => {
    const blocks = scanElements('<a><M><M>inner</M></M></a><M>second</M>', 'M')

    expect(blocks.map((block) => block.text)).toEqual(['<M><M>inner</M></M>', '<M>second</M>'])
  })

  it('treats a self-closing tag as its own block rather than opening one', () => {
    const blocks = scanElements('<M Id="1" /><M>after</M>', 'M')

    expect(blocks.map((block) => block.text)).toEqual(['<M Id="1" />', '<M>after</M>'])
  })
})

describe('moduleIdFromClsid', () => {
  // The seven values the generated parameter sets have always contained. They encode
  // the first three GUID groups little-endian, which is easy to get subtly wrong.
  it.each([
    ['{b055b40d-dec1-4d72-961c-d151e31a9ba5}', '0db455b0c1de724d961cd151e31a9ba5'],
    ['{98bec76d-d436-4208-9f8b-486be57865bd}', '6dc7be9836d408429f8b486be57865bd'],
    ['{2a657c12-787c-40c0-8e6c-d68fb6d58760}', '127c652a7c78c0408e6cd68fb6d58760'],
    ['{57584e44-d085-4d23-86e4-3be2859f4ec5}', '444e585785d0234d86e43be2859f4ec5'],
    ['{e9d8b517-6857-41d8-a4a3-60c89603d74a}', '17b5d8e95768d841a4a360c89603d74a'],
    ['{faeb97d8-ed6e-4986-8449-630c65d48156}', 'd897ebfa6eed86498449630c65d48156'],
    ['{7e8b155e-1e66-48e1-9d28-0607fa48fc11}', '5e158b7e661ee1489d280607fa48fc11'],
  ])('converts %s', (clsid, expected) => {
    expect(moduleIdFromClsid(clsid)).toBe(expected)
  })

  it('rejects anything that is not a GUID', () => {
    expect(() => moduleIdFromClsid('not-a-guid')).toThrow(/not a GUID/)
  })
})

describe('parseTmc', () => {
  const model = parseTmc(readVendorTmc('TcIoXts.tmc'))

  it('reads the library name and version', () => {
    expect(model.library).toEqual({ name: 'TcIoXts', version: '4.4.22.0' })
  })

  it('strips the byte order mark the TMC is written with', () => {
    expect(stripBom('﻿<x/>')).toBe('<x/>')
    expect(model.text.startsWith('<?xml')).toBe(true)
  })

  it('reads the parameter set configuration with its module tree', () => {
    const configuration = model.configurations.find((entry) => entry.name === 'StandardParameterSet')

    expect(configuration.modules.map((module) => module.name)).toEqual([
      'XTS Mover Parameter Set',
      'General',
      'Encoder',
      'Position Controller',
      'Velocity Controller',
      'Filter',
      'Feed Forward',
    ])
    expect(configuration.modules[0].parentOtcid).toBeUndefined()
    expect(configuration.modules.slice(1).every((module) => module.parentOtcid === 1)).toBe(true)
  })

  it('marks online parameters, so they can be kept out of the stored values', () => {
    const general = model.modules.get('98BEC76D-D436-4208-9F8B-486BE57865BD')
    const byName = Object.fromEntries(general.parameters.map((p) => [p.name, p]))

    expect(byName.Version.online).toBe(true)
    expect(byName.VersionString.online).toBe(true)
    expect(byName.ModuleId.online).toBe(false)
    expect(byName.OperationMode.online).toBe(false)
  })
})

describe('resolveBitSize', () => {
  const model = parseTmc(readVendorTmc('TcIoXts.tmc'))
  const bitSizeOf = (name) => {
    const type = [...model.dataTypes.values()].find((entry) => entry.name === name)
    return resolveBitSize(type.guid, model.dataTypes)
  }

  // The TMC states <BitSize> for only 58 of its 209 data types. Everything below has
  // to be derived, and a wrong answer yields an XTI TwinCAT misreads rather than rejects.
  it('derives an enum size from the base type it extends', () => {
    expect(bitSizeOf('MoverControllerOperationMode')).toBe(32)
  })

  it('derives a struct size from the sum of its members', () => {
    expect(bitSizeOf('TcVersion')).toBe(128)
  })

  it('derives an OTCID reference size through the alias chain', () => {
    expect(bitSizeOf('XtsMoverGeneralParameterSetOTCID')).toBe(32)
  })

  it('refuses to guess at an unknown type', () => {
    expect(() => resolveBitSize('{DEADBEEF-0000-0000-0000-000000000000}', model.dataTypes)).toThrow(
      /neither declared in the TMC nor a known built-in type/
    )
  })
})

describe('resolveDefaultEnumText', () => {
  const model = parseTmc(readVendorTmc('TcIoXts.tmc'))

  /**
   * `OperationMode` declares `CSP` as its default, which is not one of the four members
   * of `MoverControllerOperationMode`. TwinCAT resolves that by falling back to the
   * data type's own default, which is why exported files say `CyclicSynchronousPosition`.
   */
  it('falls back to the type default when the parameter names a non-member', () => {
    const general = model.modules.get('98BEC76D-D436-4208-9F8B-486BE57865BD')
    const parameter = general.parameters.find((entry) => entry.name === 'OperationMode')
    const type = model.dataTypes.get(parameter.baseTypeGuid)

    expect(parameter.default.enumText).toBe('CSP')
    expect(resolveDefaultEnumText(parameter, type)).toBe('CyclicSynchronousPosition')
  })

  it('keeps a default that is a member of its type', () => {
    const general = model.modules.get('98BEC76D-D436-4208-9F8B-486BE57865BD')
    const parameter = general.parameters.find((entry) => entry.name === 'StandstillSwitchMode')
    const type = model.dataTypes.get(parameter.baseTypeGuid)

    expect(resolveDefaultEnumText(parameter, type)).toBe('BLENDING_AFTER_SWITCHTIME')
  })
})

describe('collectDataTypeClosure', () => {
  const model = parseTmc(readVendorTmc('TcIoXts.tmc'))
  const configuration = model.configurations.find((entry) => entry.name === 'StandardParameterSet')

  it('finds every non-primitive type the parameter set modules reach, in reference order', () => {
    const closure = collectDataTypeClosure(model, configuration.modules.map((entry) => entry.clsid))

    // Reference order, not the order the TMC declares them in: the six OTCID references
    // of the root module come first, then TcVersion, then the enums as the sub-modules
    // introduce them.
    expect(closure.map((type) => type.name)).toEqual([
      'XtsMoverGeneralParameterSetOTCID',
      'XtsMoverEncoderParameterSetOTCID',
      'XtsMoverPositionControllerParameterSetOTCID',
      'XtsMoverVelocityControllerParameterSetOTCID',
      'XtsMoverFilterParameterSetOTCID',
      'XtsMoverFeedForwardParameterSetOTCID',
      'TcVersion',
      'MoverControllerOperationMode',
      'StandStillSwitchMode',
      'InterpolatorType',
      'VelocityFeedbackMode',
      'PositionFeedbackMode',
      'PositionLoopType',
      'VelocityLoopType',
      'FilterType',
      'FeedforwardType',
    ])
  })

  it('names the module that is missing rather than producing a short closure', () => {
    expect(() => collectDataTypeClosure(model, ['{00000000-0000-0000-0000-000000000000}'])).toThrow(
      /has no module/
    )
  })
})
