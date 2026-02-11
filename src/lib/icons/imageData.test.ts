import { describe, it, expect } from 'vitest'
import { hexToDataUrl, SD_ICONS, MC_ICONS } from './imageData'

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

describe('SD_ICONS', () => {
  it('contains all 6 SoftDrive module icons', () => {
    expect(SD_ICONS).toHaveProperty('interpolator')
    expect(SD_ICONS).toHaveProperty('encoder')
    expect(SD_ICONS).toHaveProperty('positionControl')
    expect(SD_ICONS).toHaveProperty('velocityControl')
    expect(SD_ICONS).toHaveProperty('filter')
    expect(SD_ICONS).toHaveProperty('feedForward')
  })

  it('all icons start with BMP magic bytes (424D)', () => {
    for (const [, hex] of Object.entries(SD_ICONS)) {
      expect(hex.substring(0, 4).toUpperCase()).toBe('424D')
    }
  })

  it('all icons produce valid data URLs', () => {
    for (const [, hex] of Object.entries(SD_ICONS)) {
      const url = hexToDataUrl(hex)
      expect(url).toMatch(/^data:image\/bmp;base64,/)
      const base64Part = url.replace('data:image/bmp;base64,', '')
      expect(() => atob(base64Part)).not.toThrow()
    }
  })
})

describe('MC_ICONS', () => {
  it('contains all 6 MoverController module icons', () => {
    expect(MC_ICONS).toHaveProperty('general')
    expect(MC_ICONS).toHaveProperty('encoder')
    expect(MC_ICONS).toHaveProperty('positionControl')
    expect(MC_ICONS).toHaveProperty('velocityControl')
    expect(MC_ICONS).toHaveProperty('filter')
    expect(MC_ICONS).toHaveProperty('feedForward')
  })

  it('all icons start with BMP magic bytes (424D)', () => {
    for (const [, hex] of Object.entries(MC_ICONS)) {
      expect(hex.substring(0, 4).toUpperCase()).toBe('424D')
    }
  })

  it('all icons produce valid data URLs', () => {
    for (const [, hex] of Object.entries(MC_ICONS)) {
      const url = hexToDataUrl(hex)
      expect(url).toMatch(/^data:image\/bmp;base64,/)
    }
  })
})
