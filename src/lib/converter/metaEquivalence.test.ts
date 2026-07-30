import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the TMC pipeline is plain ESM, deliberately outside the app's build.
import { parseTmc } from '../../../scripts/lib/tmc.mjs'
// @ts-expect-error — see above.
import { buildMeta, buildModuleDescriptors } from '../../../scripts/lib/meta.mjs'
// @ts-expect-error — see above.
import { MC_OVERLAY, SD_OVERLAY } from '../../../scripts/lib/overlay.mjs'
import { MC_PARAMETER_META, SD_PARAMETER_META } from './types'
import { MC_MODULES, SD_MODULES } from './modules'

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8')

/**
 * The gate that lets the hand-written parameter tables be deleted.
 *
 * `MC_PARAMETER_META` and `SD_PARAMETER_META` were transcribed from these two TMCs by
 * hand. If the generator reproduces them exactly from the same files, then the split
 * between "the TMC knows this" and "we decided this" is drawn in the right place, and
 * the same generator can be trusted on a driver version nobody has transcribed.
 *
 * Key order is compared as well as content: it is the order the UI renders parameters
 * in, and it is not the order the TMC declares them in.
 */
describe('generated parameter metadata', () => {
  const mc = parseTmc(read('TcIoXts.tmc'))
  const sd = parseTmc(read('TcSoftDrive.tmc'))

  describe('MoverController', () => {
    const { meta, errors, warnings } = buildMeta(mc, MC_OVERLAY)

    it('reports no drift against the overlay', () => {
      expect(errors).toEqual([])
    })

    it('matches the hand-written table', () => {
      expect(meta).toEqual(MC_PARAMETER_META)
    })

    it('preserves the display order of every module', () => {
      for (const [module, parameters] of Object.entries(MC_PARAMETER_META)) {
        expect(Object.keys(meta[module])).toEqual(Object.keys(parameters))
      }
    })

    it('lists the driver parameters the overlay does not surface', () => {
      // Not a defect: these exist in TcIoXts but are not part of the conversion. The
      // warning is here so that a new one shows up as a change to this list.
      expect(warnings.map((entry: string) => entry.replace(/^Module '\w+' has a new parameter '/, '').replace(/'.*$/, '')))
        .toEqual([
          'EnableForceLimit',
          'ForceLimit',
          'EnableForceLimitBeforeFeedForward',
          'ForceLimitBeforeFeedForward',
          'ExternalPositionOid',
          'Kp_precise_standstill',
          'Kd_precise_standstill',
          'Km_precise_standstill',
          'ExternalForceOid',
        ])
    })
  })

  describe('SoftDrive', () => {
    const { meta, errors } = buildMeta(sd, SD_OVERLAY)

    it('reports no drift against the overlay', () => {
      expect(errors).toEqual([])
    })

    it('matches the hand-written table', () => {
      expect(meta).toEqual(SD_PARAMETER_META)
    })

    it('preserves the display order of every module', () => {
      for (const [module, parameters] of Object.entries(SD_PARAMETER_META)) {
        expect(Object.keys(meta[module])).toEqual(Object.keys(parameters))
      }
    })
  })

  /**
   * The module icons are BMP blobs that were copied out of the TMCs into
   * `src/lib/icons/imageData.ts` by hand. Reading them back out of the TMC removes
   * that copy — including the SoftDrive object, which has no icon of its own and
   * borrows the MoverController's General icon.
   */
  describe('module descriptors', () => {
    const models = { mc, sd }

    it('matches the hand-written MoverController descriptors', () => {
      expect(buildModuleDescriptors(models, 'mc', MC_OVERLAY)).toEqual(MC_MODULES)
    })

    it('matches the hand-written SoftDrive descriptors, apart from one corrupted icon', () => {
      const generated = buildModuleDescriptors(models, 'sd', SD_OVERLAY)

      expect(generated.map((module: { key: string; label: string }) => ({ key: module.key, label: module.label })))
        .toEqual(SD_MODULES.map((module) => ({ key: module.key, label: module.label })))

      for (const module of generated) {
        const expected = SD_MODULES.find((entry) => entry.key === module.key)!
        if (module.key === 'interpolator') continue
        expect(module.iconHex, `icon of ${module.key}`).toBe(expected.iconHex)
      }
    })

    /**
     * The one place where reading the TMC changes what the user sees.
     *
     * Row 4 of the hand-copied interpolator icon lost the blue arrow tip: three
     * coloured pixels were replaced by a transparent one and the rest of the row
     * shifted by a pixel. Thirteen 32-bit pixels differ, all in that row, and the TMC
     * is the source this was copied from — so the generated icon is the correct one.
     * Asserted rather than skipped, so that any *further* icon drift still fails.
     */
    it('restores the interpolator icon row that was lost when it was copied by hand', () => {
      const generated = buildModuleDescriptors(models, 'sd', SD_OVERLAY)
      const icon = generated.find((module: { key: string }) => module.key === 'interpolator')!.iconHex
      const handWritten = SD_MODULES.find((module) => module.key === 'interpolator')!.iconHex

      expect(icon).toHaveLength(handWritten.length)

      const pixels = (hex: string) => hex.match(/.{8}/g) ?? []
      const differing = pixels(icon).filter((pixel, index) => pixel !== pixels(handWritten)[index])

      expect(differing).toHaveLength(13)
      expect(icon.slice(640, 664)).toBe('00002B66ED005E81D3009EA3')
      expect(handWritten.slice(640, 664)).toBe('000000000000A4A4A4009E9E')
    })
  })
})
