import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseTmc } from './tmc.mjs'
import { buildMeta, collectParameterPool } from './meta.mjs'
import { MC_OVERLAY } from './overlay.mjs'

const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8')

const mc = parseTmc(read('TcIoXts.tmc'))
const sd = parseTmc(read('TcSoftDrive.tmc'))

const moduleNamed = (model, name) => [...model.modules.values()].find((entry) => entry.name === name)

/** A copy of the overlay with one module's parameters replaced. */
const overlayWith = (moduleKey, parameters) => ({
  modules: MC_OVERLAY.modules.map((module) =>
    module.key === moduleKey ? { ...module, parameters } : { ...module, parameters: {} }
  ),
})

describe('collectParameterPool', () => {
  it('exposes the members of an inline struct instead of the struct itself', () => {
    const pool = collectParameterPool(moduleNamed(sd, 'CTcSdFilter'))

    // The SoftDrive filter parameters the user edits all live inside one parameter.
    expect([...pool.keys()]).toEqual(
      expect.arrayContaining(['Type', 'ConfigurationFilter.Type', 'LowPassFrequency', 'HighPassDamping'])
    )
    expect(pool.get('Type').path).toBe('ConfigurationFilter.Type')
  })

  it('does not give a struct member the unit of the struct it belongs to', () => {
    const pool = collectParameterPool(moduleNamed(sd, 'CTcSdFilter'))

    // ConfigurationFilter as a whole is declared in Hz, but damping is dimensionless.
    expect(pool.get('LowPassFrequency').unit).toBe('Hz')
    expect(pool.get('LowPassDamping').unit).toBeUndefined()
  })

  it('describes a member with its own comment, not the first enum member’s', () => {
    const pool = collectParameterPool(moduleNamed(sd, 'CTcSdFilter'))

    // `FILTER_OFF` is documented as "load filter is switched off"; that describes the
    // value, not the parameter, and must not become the parameter's tooltip.
    expect(pool.get('Type').comment).toBeUndefined()
  })

  it('drops the short name when two structs use it, keeping both paths', () => {
    const pool = collectParameterPool(moduleNamed(sd, 'CTcSoftDrive'))

    expect(pool.has('Reserved')).toBe(false)
    expect(pool.has('TcMc3ActData.Reserved')).toBe(true)
    expect(pool.has('SoftDriveExternalEncoder.Reserved')).toBe(true)
  })
})

describe('buildMeta', () => {
  it('derives type, unit, comment and enum members from the TMC', () => {
    const { meta } = buildMeta(mc, overlayWith('general', { StandstillSwitchMode: { displayName: 'Mode' } }))

    expect(meta.general.StandstillSwitchMode).toEqual({
      name: 'StandstillSwitchMode',
      displayName: 'Mode',
      unit: '',
      type: 'enum',
      // In TMC order here, because this overlay entry does not override it.
      enumOptions: ['DIRECT_AT_SWITCHTIME', 'BLENDING_BEFORE_SWITCHTIME', 'BLENDING_AFTER_SWITCHTIME'],
      group: 'General',
      comment: 'Mode for blending normal standard parameter into standstill parameter.',
    })
  })

  it('treats a BOOL as an enum, since a parameter set stores it as text', () => {
    const { meta } = buildMeta(
      mc,
      overlayWith('velocityControl', { ResetIPartAtMotionStart: { displayName: 'Reset' } })
    )

    expect(meta.velocityControl.ResetIPartAtMotionStart.type).toBe('enum')
    expect(meta.velocityControl.ResetIPartAtMotionStart.enumOptions).toEqual(['FALSE', 'TRUE'])
  })

  it('fails when the overlay names a parameter the driver no longer has', () => {
    const { errors } = buildMeta(mc, overlayWith('general', { RemovedByBeckhoff: { displayName: 'Gone' } }))

    expect(errors).toEqual([
      expect.stringContaining("Parameter 'RemovedByBeckhoff' of module 'general' is no longer in the TMC"),
    ])
  })

  it('fails when a dependency names an enum value the driver dropped', () => {
    const { errors } = buildMeta(
      mc,
      overlayWith('positionControl', {
        PositionLoopType: { displayName: 'Type' },
        Kp: { displayName: 'Kp', dependsOn: { paramKey: 'PositionLoopType', values: ['P_POSITION_RETIRED'] } },
      })
    )

    expect(errors).toEqual([expect.stringContaining('P_POSITION_RETIRED')])
  })

  it('only warns about a parameter the driver added, so it stays hidden until reviewed', () => {
    const { meta, errors, warnings } = buildMeta(
      mc,
      overlayWith('general', { OperationMode: { displayName: 'Operation Mode' } })
    )

    expect(errors).toEqual([])
    expect(Object.keys(meta.general)).toEqual(['OperationMode'])
    expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("'ForceLimit'")]))
  })

  it('accepts an overlay-only parameter that the TMC does not declare', () => {
    const { meta, errors } = buildMeta(
      mc,
      overlayWith('general', {
        FromAnotherBuild: { notInTmc: true, displayName: 'From Another Build', unit: 'A', type: 'number' },
      })
    )

    expect(errors).toEqual([])
    expect(meta.general.FromAnotherBuild).toEqual({
      name: 'FromAnotherBuild',
      displayName: 'From Another Build',
      unit: 'A',
      type: 'number',
    })
  })
})
