import { describe, it, expect } from 'vitest'
import { hexToDataUrl } from './imageData'
import { mcModules, sdModules } from '@/lib/tmc/registry'

describe('hexToDataUrl', () => {
  it('converts a simple hex string to a data URL', () => {
    const hex = '424D'
    const result = hexToDataUrl(hex)
    expect(result).toMatch(/^data:image\/bmp;base64,/)
  })

  it('produces valid base64 content', () => {
    const hex = '424D3604'
    const result = hexToDataUrl(hex)
    const base64Part = result.replace('data:image/bmp;base64,', '')
    expect(() => atob(base64Part)).not.toThrow()
  })

  it('correctly encodes known bytes', () => {
    // "BM" = 0x42 0x4D
    const hex = '424D'
    const result = hexToDataUrl(hex)
    const base64Part = result.replace('data:image/bmp;base64,', '')
    const decoded = atob(base64Part)
    expect(decoded).toBe('BM')
  })

  it('handles empty string', () => {
    const result = hexToDataUrl('')
    expect(result).toBe('data:image/bmp;base64,')
  })
})

/**
 * The icons used to be hex blobs copied into this file by hand. They now come out of
 * the TMC with the rest of the per-version dataset, so what is worth checking is that
 * every module still has one and that it decodes as a bitmap.
 */
describe('module icons', () => {
  it.each([
    ['MoverController', mcModules],
    ['SoftDrive', sdModules],
  ])('gives every %s module a decodable BMP', (_side, modules) => {
    const descriptors = modules()
    expect(descriptors.length).toBeGreaterThan(0)

    for (const module of descriptors) {
      expect(module.iconHex, module.key).toMatch(/^[0-9A-Fa-f]+$/)
      // "BM", the bitmap magic number.
      expect(module.iconHex.slice(0, 4).toUpperCase(), module.key).toBe('424D')
      expect(hexToDataUrl(module.iconHex)).toMatch(/^data:image\/bmp;base64,/)
    }
  })
})
