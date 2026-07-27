import { describe, it, expect } from 'vitest'
import { locateSoftDrive, getEnumValue, getNumericValue, getBooleanValue, hasValue } from './locate'

function parse(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'text/xml')
}

const PARAMETER_SET_XML = `<?xml version="1.0" encoding="utf-8"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues>
      <Value><Name>HardwareModulo</Name><Value>3000</Value></Value>
    </ParameterValues>
    <ParameterSets>
      <ParameterSet>
        <TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId>
        <ParameterValues>
          <Value><Name>VelocityFeedbackMode</Name><EnumText>OBSERVER</EnumText></Value>
          <Value><Name>PositionLowPassFilter</Name><Value>500</Value></Value>
        </ParameterValues>
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

/** Mirrors the real .xti layout: sub-modules are siblings of the SoftDrive TmcDesc. */
const MOVER_AXIS_XTI = `<?xml version="1.0"?>
<TcSmItem ClassName="CNcAxisDef">
  <Axis>
    <Module Id="#x01010010">
      <Name>SoftDrive 1</Name>
      <TmcDesc GUID="{272A98C0-4C87-4243-BED6-3BB69E29F02C}">
        <ParameterValues>
          <Value><Name>HardwareModulo</Name><Value>3000</Value></Value>
        </ParameterValues>
      </TmcDesc>
      <Module Id="#x01010030">
        <TmcDesc GUID="{8D695A14-7DB9-4D35-A64A-30D334B5E2D3}">
          <ParameterValues>
            <Value><Name>VelocityFeedbackMode</Name><EnumText>OBSERVER</EnumText></Value>
            <Value><Name>PositionLowPassFilter</Name><Value>500</Value></Value>
          </ParameterValues>
        </TmcDesc>
      </Module>
    </Module>
  </Axis>
</TcSmItem>`

describe('locateSoftDrive', () => {
  it('detects the ParameterExport format', () => {
    const located = locateSoftDrive(parse(PARAMETER_SET_XML))
    expect(located?.format).toBe('parameterSet')
  })

  it('detects the Mover Axis XTI format', () => {
    const located = locateSoftDrive(parse(MOVER_AXIS_XTI))
    expect(located?.format).toBe('moverAxisXti')
  })

  it('matches XTI GUIDs regardless of braces and casing', () => {
    const located = locateSoftDrive(parse(MOVER_AXIS_XTI))
    expect(located?.modules.encoder).not.toBeNull()
    expect(getEnumValue(located!.modules.encoder, 'VelocityFeedbackMode')).toBe('OBSERVER')
  })

  it('reads the same values from both formats', () => {
    const fromXml = locateSoftDrive(parse(PARAMETER_SET_XML))!
    const fromXti = locateSoftDrive(parse(MOVER_AXIS_XTI))!

    expect(getNumericValue(fromXml.modules.encoder, 'PositionLowPassFilter')).toBe(500)
    expect(getNumericValue(fromXti.modules.encoder, 'PositionLowPassFilter')).toBe(500)
    expect(getNumericValue(fromXml.root, 'HardwareModulo')).toBe(3000)
    expect(getNumericValue(fromXti.root, 'HardwareModulo')).toBe(3000)
  })

  it('does not confuse the SoftDrive root with its sub-modules', () => {
    const located = locateSoftDrive(parse(MOVER_AXIS_XTI))!
    // HardwareModulo lives on the root only, VelocityFeedbackMode on the encoder only.
    expect(getEnumValue(located.root, 'VelocityFeedbackMode')).toBeNull()
    expect(getNumericValue(located.modules.encoder, 'HardwareModulo')).toBeNull()
  })

  it('reports modules that are absent as null', () => {
    const located = locateSoftDrive(parse(MOVER_AXIS_XTI))!
    expect(located.modules.filter).toBeNull()
    expect(located.modules.velocityControl).toBeNull()
  })

  it('falls back to the other locator when the root element is unexpected', () => {
    const renamed = MOVER_AXIS_XTI.replace('TcSmItem ClassName="CNcAxisDef"', 'ParameterExport')
      .replace('</TcSmItem>', '</ParameterExport>')
    const located = locateSoftDrive(parse(renamed))
    expect(located?.format).toBe('moverAxisXti')
  })

  it('returns null when no SoftDrive is present', () => {
    expect(locateSoftDrive(parse('<ParameterExport><ParameterSet><TypeId>Axis</TypeId></ParameterSet></ParameterExport>'))).toBeNull()
  })
})

describe('value readers', () => {
  const root = locateSoftDrive(parse(PARAMETER_SET_XML))!.root

  it('returns null for a missing value', () => {
    expect(getNumericValue(root, 'Nope')).toBeNull()
    expect(getEnumValue(root, 'Nope')).toBeNull()
    expect(getBooleanValue(root, 'Nope')).toBeNull()
  })

  it('returns null for a null container', () => {
    expect(getNumericValue(null, 'HardwareModulo')).toBeNull()
    expect(hasValue(null, 'HardwareModulo')).toBe(false)
  })

  it('distinguishes a present value from a missing one', () => {
    expect(hasValue(root, 'HardwareModulo')).toBe(true)
    expect(hasValue(root, 'Nope')).toBe(false)
  })

  it('reads booleans from EnumText and from Value', () => {
    const doc = parse(`<ParameterExport><ParameterSet><TypeId>SoftDrive</TypeId><ParameterValues>
      <Value><Name>A</Name><EnumText>TRUE</EnumText></Value>
      <Value><Name>B</Name><EnumText>FALSE</EnumText></Value>
      <Value><Name>C</Name><Value>1</Value></Value>
      <Value><Name>D</Name><Value>0</Value></Value>
      <Value><Name>E</Name><EnumText>true</EnumText></Value>
    </ParameterValues></ParameterSet></ParameterExport>`)
    const sd = locateSoftDrive(doc)!.root

    expect(getBooleanValue(sd, 'A')).toBe(true)
    expect(getBooleanValue(sd, 'B')).toBe(false)
    expect(getBooleanValue(sd, 'C')).toBe(true)
    expect(getBooleanValue(sd, 'D')).toBe(false)
    expect(getBooleanValue(sd, 'E')).toBe(true)
  })
})
