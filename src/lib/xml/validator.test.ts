import { describe, it, expect } from 'vitest'
import { validateSoftDriveXml } from './validator'

const VALID_XML = `<?xml version="1.0" encoding="utf-8"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>Mover</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet>
        <TypeId>Axis</TypeId>
        <ParameterValues />
        <ParameterSets>
          <ParameterSet>
            <TypeId>SoftDrive</TypeId>
            <ParameterValues />
            <ParameterSets>
              <ParameterSet>
                <TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId>
                <ParameterValues />
              </ParameterSet>
              <ParameterSet>
                <TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId>
                <ParameterValues />
              </ParameterSet>
            </ParameterSets>
          </ParameterSet>
        </ParameterSets>
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

describe('validateSoftDriveXml', () => {
  it('accepts a valid XML with all required modules', () => {
    const result = validateSoftDriveXml(VALID_XML)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects malformed XML', () => {
    const result = validateSoftDriveXml('<not valid xml')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toContain('XML parse error')
  })

  it('rejects XML with wrong root element', () => {
    const xml = `<?xml version="1.0"?><WrongRoot><ParameterSet><TypeId>SoftDrive</TypeId></ParameterSet></WrongRoot>`
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('ParameterExport'))).toBe(true)
  })

  it('rejects XML without SoftDrive ParameterSet', () => {
    const xml = `<?xml version="1.0"?><ParameterExport><ParameterSet><TypeId>NotSoftDrive</TypeId></ParameterSet></ParameterExport>`
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('SoftDrive'))).toBe(true)
  })

  it('reports missing module TypeIds', () => {
    const xml = `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet>
        <TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId>
        <ParameterValues />
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`
    const result = validateSoftDriveXml(xml)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBe(5) // missing 5 out of 6 modules
    expect(result.errors.some(e => e.includes('Encoder'))).toBe(true)
    expect(result.errors.some(e => e.includes('PositionControl'))).toBe(true)
    expect(result.errors.some(e => e.includes('VelocityControl'))).toBe(true)
    expect(result.errors.some(e => e.includes('Filter'))).toBe(true)
    expect(result.errors.some(e => e.includes('FeedForward'))).toBe(true)
  })

  it('accepts XML with SoftDrive nested deeply (Mover > Axis > SoftDrive)', () => {
    const result = validateSoftDriveXml(VALID_XML)
    expect(result.valid).toBe(true)
  })

  it('rejects empty string', () => {
    const result = validateSoftDriveXml('')
    expect(result.valid).toBe(false)
  })
})
