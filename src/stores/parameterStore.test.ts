import { describe, it, expect, beforeEach } from 'vitest'
import { useParameterStore } from './parameterStore'

const VALID_XML = `<?xml version="1.0" encoding="utf-8"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet>
        <TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId>
        <ParameterValues>
          <Value><Name>InterpolatorType</Name><EnumText>INTERPOLATION_POLYNOM3</EnumText></Value>
        </ParameterValues>
      </ParameterSet>
      <ParameterSet>
        <TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId>
        <ParameterValues>
          <Value><Name>CorrectionFactor</Name><Value>0.5</Value></Value>
        </ParameterValues>
      </ParameterSet>
      <ParameterSet>
        <TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId>
        <ParameterValues />
      </ParameterSet>
      <ParameterSet>
        <TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId>
        <ParameterValues>
          <Value><Name>Kp</Name><Value>0.1</Value></Value>
        </ParameterValues>
      </ParameterSet>
      <ParameterSet>
        <TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId>
        <ParameterValues />
      </ParameterSet>
      <ParameterSet>
        <TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId>
        <ParameterValues>
          <Value><Name>PhaseAdvanceAngle</Name><Value>36</Value></Value>
        </ParameterValues>
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

describe('parameterStore', () => {
  beforeEach(() => {
    const store = useParameterStore.getState()
    store.resetParameters()
  })

  describe('initial state', () => {
    it('has no selected mover type', () => {
      expect(useParameterStore.getState().selectedMoverType).toBeNull()
    })

    it('has no soft drive params', () => {
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })

    it('has empty validation errors', () => {
      expect(useParameterStore.getState().validationErrors).toEqual([])
    })
  })

  describe('setMoverType', () => {
    it('sets the mover type', () => {
      useParameterStore.getState().setMoverType('AT9001_0450')
      expect(useParameterStore.getState().selectedMoverType).toBe('AT9001_0450')
    })
  })

  describe('loadDefaults', () => {
    it('loads default parameters', () => {
      useParameterStore.getState().loadDefaults()
      const params = useParameterStore.getState().softDriveParams
      expect(params).not.toBeNull()
      expect(params!.interpolator.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    })

    it('clears validation errors', () => {
      useParameterStore.getState().importFromXml('invalid xml')
      expect(useParameterStore.getState().validationErrors.length).toBeGreaterThan(0)
      useParameterStore.getState().loadDefaults()
      expect(useParameterStore.getState().validationErrors).toEqual([])
    })
  })

  describe('importFromXml', () => {
    it('imports valid XML', () => {
      useParameterStore.getState().importFromXml(VALID_XML)
      const state = useParameterStore.getState()
      expect(state.softDriveParams).not.toBeNull()
      expect(state.validationErrors).toEqual([])
      expect(state.softDriveParams!.encoder.CorrectionFactor).toBe(0.5)
    })

    it('sets validation errors for invalid XML', () => {
      useParameterStore.getState().importFromXml('<not valid xml')
      const state = useParameterStore.getState()
      expect(state.validationErrors.length).toBeGreaterThan(0)
      expect(state.softDriveParams).toBeNull()
    })

    it('sets validation errors for XML missing SoftDrive', () => {
      const xml = `<?xml version="1.0"?><ParameterExport><ParameterSet><TypeId>Other</TypeId></ParameterSet></ParameterExport>`
      useParameterStore.getState().importFromXml(xml)
      const state = useParameterStore.getState()
      expect(state.validationErrors.length).toBeGreaterThan(0)
    })
  })

  describe('setSoftDriveParam', () => {
    it('updates a numeric parameter', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setSoftDriveParam('encoder', 'CorrectionFactor', 1.5)
      expect(useParameterStore.getState().softDriveParams!.encoder.CorrectionFactor).toBe(1.5)
    })

    it('updates an enum parameter', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setSoftDriveParam('interpolator', 'InterpolatorType', 'INTERPOLATION_LINEAR')
      expect(useParameterStore.getState().softDriveParams!.interpolator.InterpolatorType).toBe('INTERPOLATION_LINEAR')
    })

    it('does nothing when no params are loaded', () => {
      useParameterStore.getState().setSoftDriveParam('encoder', 'CorrectionFactor', 1.5)
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })
  })

  describe('resetParameters', () => {
    it('clears all state', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMoverType('AT9001_0450')
      useParameterStore.getState().resetParameters()

      const state = useParameterStore.getState()
      expect(state.softDriveParams).toBeNull()
      expect(state.selectedMoverType).toBeNull()
      expect(state.validationErrors).toEqual([])
    })
  })

  describe('getConvertedParams', () => {
    it('returns null when no params loaded', () => {
      useParameterStore.getState().setMoverType('AT9001_0450')
      expect(useParameterStore.getState().getConvertedParams()).toBeNull()
    })

    it('returns null when no mover type selected', () => {
      useParameterStore.getState().loadDefaults()
      expect(useParameterStore.getState().getConvertedParams()).toBeNull()
    })

    it('returns null for invalid mover type', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMoverType('INVALID_TYPE')
      expect(useParameterStore.getState().getConvertedParams()).toBeNull()
    })

    it('returns converted params when both params and mover type are set', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMoverType('AT9001_0450')
      const converted = useParameterStore.getState().getConvertedParams()
      expect(converted).not.toBeNull()
      expect(converted!.general.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    })

    it('uses correct force factor for conversion', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMoverType('AT9001_0450')
      const converted = useParameterStore.getState().getConvertedParams()
      // Default Kp = 0.1, FF = 5.4, CONST = 314
      // Expected: 0.1 * 314 * 5.4 = 169.56
      expect(converted!.velocityControl.Kp).toBeCloseTo(0.1 * 314 * 5.4, 2)
    })

    it('reflects parameter changes in conversion output', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMoverType('AT9001_0450')

      useParameterStore.getState().setSoftDriveParam('velocityControl', 'Kp', 0.2)
      const converted = useParameterStore.getState().getConvertedParams()
      expect(converted!.velocityControl.Kp).toBeCloseTo(0.2 * 314 * 5.4, 2)
    })
  })
})
