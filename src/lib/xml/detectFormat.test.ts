import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { detectParameterSetKind } from './detectFormat'
import { generateXti } from '@/lib/xti/generateXti'
import { createDefaultMoverControllerParameters } from '@/lib/converter/defaults'

function sample(name: string): string {
  return readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
}

describe('detectParameterSetKind', () => {
  it('recognises a SoftDrive parameter export', () => {
    expect(detectParameterSetKind(sample('ParameterSet.xml'))).toBe('softDrive')
    expect(detectParameterSetKind(sample('ParameterSet_Old.xml'))).toBe('softDrive')
  })

  // Both generations are stored in a TcSmItem, so only the module GUIDs tell them apart.
  it('recognises a Mover Axis XTI as SoftDrive', () => {
    expect(detectParameterSetKind(sample('Mover_Axis_1.xti'))).toBe('softDrive')
  })

  it('recognises a MoverController XTI', () => {
    expect(detectParameterSetKind(sample('MoverControllerDefaultParameterSet.xti'))).toBe(
      'moverController'
    )
  })

  it('recognises a parameter set this app generated', () => {
    const xml = generateXti(createDefaultMoverControllerParameters())
    expect(detectParameterSetKind(xml)).toBe('moverController')
  })

  it('returns null for a file that holds neither', () => {
    expect(detectParameterSetKind('<html><body>hi</body></html>')).toBeNull()
    expect(detectParameterSetKind('not xml at all')).toBeNull()
    expect(detectParameterSetKind('')).toBeNull()
  })
})
