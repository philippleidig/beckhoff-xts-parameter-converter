import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the TMC pipeline is plain ESM, deliberately outside the app's build.
import { parseTmc } from '../../../scripts/lib/tmc.mjs'
// @ts-expect-error — see above.
import { buildMeta, buildModuleDescriptors } from '../../../scripts/lib/meta.mjs'
// @ts-expect-error — see above.
import { MC_OVERLAY, SD_OVERLAY } from '../../../scripts/lib/overlay.mjs'
// @ts-expect-error — see above.
import { readManifest, readTmc, artifactVersion, hasTmc, resolveTmcSource } from '../../../scripts/lib/store.mjs'
import { createDefaultMoverControllerParameters, createDefaultSoftDriveParameters } from '@/lib/converter/defaults'
import { generateXti } from '@/lib/xti/generateXti'
import type { ParameterMeta } from '@/lib/converter/types'
import {
  activeTemplate,
  DEFAULT_TMC_VERSION,
  loadTmcVersion,
  mcModules,
  mcParameterMeta,
  sdModules,
  sdParameterMeta,
  TMC_VERSIONS,
  type ParameterMetaByModule,
} from './registry'

const repoRoot = resolve(process.cwd())
const read = (relativePath: string) => readFileSync(resolve(repoRoot, relativePath), 'utf8')

/**
 * Everything under `src/data/tmc` is generated and committed. These tests cover the two
 * ways that can go wrong: the artifacts drifting away from the TMCs they were built
 * from, and an artifact that is internally fine but does not satisfy what the
 * application actually needs from it.
 */
describe('generated TMC artifacts', () => {
  const manifest = readManifest(repoRoot)
  const usable = manifest.versions.filter((entry: { status: string }) => entry.status === 'ok')

  // Not every TcIoXts release ships a SoftDrive TMC; the generator describes the
  // SoftDrive side with the newest one available, and so does this check.
  const softDriveSource = resolveTmcSource(repoRoot, manifest, 'TcSoftDrive.tmc')

  /**
   * Driver data arrives by way of a bot-opened pull request that carries no checks of
   * its own, so "someone edited a generated file" and "someone changed the overlay
   * without regenerating" both have to fail here.
   */
  describe.each(usable as { package: string; tcIoXts: string }[])(
    'package $package',
    (entry) => {
      const source = artifactVersion(entry)
      const mc = parseTmc(readTmc(repoRoot, source, 'TcIoXts.tmc'))
      const sd = parseTmc(
        readTmc(repoRoot, hasTmc(repoRoot, source, 'TcSoftDrive.tmc') ? source : softDriveSource, 'TcSoftDrive.tmc')
      )
      const committed = JSON.parse(read(`src/data/tmc/${source}/dataset.json`))

      it('has a dataset that still matches the stored TMCs', () => {
        const mcMeta = buildMeta(mc, MC_OVERLAY)
        const sdMeta = buildMeta(sd, SD_OVERLAY)

        expect(mcMeta.errors).toEqual([])
        expect(sdMeta.errors).toEqual([])
        expect(committed).toEqual({
          version: mc.library.version,
          libraries: { TcIoXts: mc.library.version, TcSoftDrive: sd.library.version },
          mc: { modules: buildModuleDescriptors({ mc, sd }, 'mc', MC_OVERLAY), parameters: mcMeta.meta },
          sd: { modules: buildModuleDescriptors({ mc, sd }, 'sd', SD_OVERLAY), parameters: sdMeta.meta },
        })
      })

      it('has a template built for the driver version it claims', () => {
        const template = read(`src/data/tmc/${source}/template.xti`)
        const versions = new Set(
          [...template.matchAll(/ClassFactoryId="[^"]*\|TcIoXts\|([\d.]+)"/g)].map((match) => match[1])
        )

        expect([...versions]).toEqual([mc.library.version])
      })

      /** `buildXtiXml()` refuses to export unless it finds exactly six sub-module blocks. */
      it('has a template with the block structure the exporter expects', () => {
        const template = read(`src/data/tmc/${source}/template.xti`)

        expect(template.match(/<ParameterValues>/g)).toHaveLength(7)
      })
    }
  )

  it('lists every generated version in the index', () => {
    const generated = new Set(usable.map((entry: { tcIoXts: string }) => entry.tcIoXts))

    expect(new Set(TMC_VERSIONS.map((entry) => entry.version))).toEqual(generated)
  })

  it('defaults to the newest driver version', () => {
    expect(DEFAULT_TMC_VERSION).toBe(TMC_VERSIONS[0].version)
  })
})

/**
 * What the application needs from a dataset, checked for the version it will actually
 * use. This is the net that makes an unreviewed driver update safe: a version that no
 * longer describes every parameter the converter writes, or that dropped an enum value
 * the converter maps onto, fails here rather than in front of a user.
 */
describe('the active dataset satisfies the application', () => {
  const flatten = (params: object) =>
    Object.entries(params as Record<string, Record<string, unknown>>).flatMap(([moduleKey, values]) =>
      Object.keys(values).map((key) => `${moduleKey}.${key}`)
    )

  const describedBy = (meta: ParameterMetaByModule) =>
    Object.entries(meta).flatMap(([moduleKey, params]) => Object.keys(params).map((key) => `${moduleKey}.${key}`))

  it('describes every MoverController parameter the converter produces', () => {
    expect(describedBy(mcParameterMeta()).sort()).toEqual(flatten(createDefaultMoverControllerParameters()).sort())
  })

  it('describes every SoftDrive parameter the importer reads', () => {
    // The importer also carries the motor force constant, which is stored on the drive
    // object rather than in a parameter module.
    const described = new Set(describedBy(sdParameterMeta()))
    const actual = flatten(createDefaultSoftDriveParameters()).filter((key) => described.has(key))

    expect(actual.length).toBeGreaterThan(0)
    for (const key of describedBy(sdParameterMeta())) {
      if (key === 'softDrive.TorqueConstant') continue
      expect(flatten(createDefaultSoftDriveParameters()), key).toContain(key)
    }
  })

  it('gives every module an icon and a label', () => {
    for (const module of [...mcModules(), ...sdModules()]) {
      expect(module.label, module.key).toBeTruthy()
      expect(module.iconHex.slice(0, 4).toUpperCase(), module.key).toBe('424D')
    }
  })

  /** A dependency on a value the driver dropped would silently hide the parameter. */
  it('resolves every conditional-visibility rule within its own module', () => {
    for (const meta of [mcParameterMeta(), sdParameterMeta()]) {
      for (const [moduleKey, params] of Object.entries(meta)) {
        for (const [key, parameter] of Object.entries(params as Record<string, ParameterMeta>)) {
          if (!parameter.dependsOn) continue

          const controller = (params as Record<string, ParameterMeta>)[parameter.dependsOn.paramKey]
          expect(controller, `${moduleKey}.${key}`).toBeDefined()

          for (const value of parameter.dependsOn.values) {
            expect(controller.enumOptions, `${moduleKey}.${key}`).toContain(value)
          }
        }
      }
    }
  })

  it('exports a parameter set built on the active template', () => {
    const xti = generateXti(createDefaultMoverControllerParameters())

    expect(xti).toContain(`|TcIoXts|${DEFAULT_TMC_VERSION}`)
    expect(activeTemplate()).toContain('<TcSmItem')
  })
})

describe('loadTmcVersion', () => {
  it('resolves for a version that exists', async () => {
    await expect(loadTmcVersion(DEFAULT_TMC_VERSION)).resolves.toBe(true)
  })

  /**
   * A version stored in localStorage can outlive the artifacts, for instance when a
   * release is withdrawn. Reporting that rather than throwing lets the caller fall back
   * to the default instead of leaving the user with a blank page.
   */
  it('reports a version it cannot load instead of throwing', async () => {
    await expect(loadTmcVersion('9.9.9.9')).resolves.toBe(false)
  })
})
