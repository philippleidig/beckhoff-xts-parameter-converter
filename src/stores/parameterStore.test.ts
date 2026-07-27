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
      expect(useParameterStore.getState().selectedMagnetPlateType).toBeNull()
    })

    it('has no soft drive params', () => {
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })

    it('has empty validation errors', () => {
      expect(useParameterStore.getState().validationErrors).toEqual([])
    })
  })

  describe('setMagnetPlateType', () => {
    it('sets the mover type', () => {
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')
      expect(useParameterStore.getState().selectedMagnetPlateType).toBe('AT9001_0450')
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
      useParameterStore.getState().importFromFile('invalid xml')
      expect(useParameterStore.getState().validationErrors.length).toBeGreaterThan(0)
      useParameterStore.getState().loadDefaults()
      expect(useParameterStore.getState().validationErrors).toEqual([])
    })
  })

  describe('importFromFile', () => {
    it('imports valid XML', () => {
      useParameterStore.getState().importFromFile(VALID_XML)
      const state = useParameterStore.getState()
      expect(state.softDriveParams).not.toBeNull()
      expect(state.validationErrors).toEqual([])
      expect(state.softDriveParams!.encoder.CorrectionFactor).toBe(0.5)
    })

    it('sets validation errors for invalid XML', () => {
      useParameterStore.getState().importFromFile('<not valid xml')
      const state = useParameterStore.getState()
      expect(state.validationErrors.length).toBeGreaterThan(0)
      expect(state.softDriveParams).toBeNull()
    })

    it('sets validation errors for XML missing SoftDrive', () => {
      const xml = `<?xml version="1.0"?><ParameterExport><ParameterSet><TypeId>Other</TypeId></ParameterSet></ParameterExport>`
      useParameterStore.getState().importFromFile(xml)
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
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')
      useParameterStore.getState().resetParameters()

      const state = useParameterStore.getState()
      expect(state.softDriveParams).toBeNull()
      expect(state.selectedMagnetPlateType).toBeNull()
      expect(state.validationErrors).toEqual([])
    })
  })

  describe('getConvertedParams', () => {
    it('returns null when no params loaded', () => {
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')
      expect(useParameterStore.getState().getConvertedParams()).toBeNull()
    })

    it('returns null when no mover type selected', () => {
      useParameterStore.getState().loadDefaults()
      expect(useParameterStore.getState().getConvertedParams()).toBeNull()
    })

    it('returns null for invalid mover type', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMagnetPlateType('INVALID_TYPE')
      expect(useParameterStore.getState().getConvertedParams()).toBeNull()
    })

    it('returns converted params when both params and mover type are set', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')
      const converted = useParameterStore.getState().getConvertedParams()
      expect(converted).not.toBeNull()
      expect(converted!.general.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    })

    it('uses correct force factor for conversion', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')
      const converted = useParameterStore.getState().getConvertedParams()
      // Default Kp = 0.1, FF = 5.4, CONST = 314
      // Expected: 0.1 * 314 * 5.4 = 169.56
      expect(converted!.velocityControl.Kp).toBeCloseTo(0.1 * 314 * 5.4, 2)
    })

    it('reflects parameter changes in conversion output', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')

      useParameterStore.getState().setSoftDriveParam('velocityControl', 'Kp', 0.2)
      const converted = useParameterStore.getState().getConvertedParams()
      expect(converted!.velocityControl.Kp).toBeCloseTo(0.2 * 314 * 5.4, 2)
    })

    it('derives the area variant from the _area parameters', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')
      useParameterStore.getState().setSoftDriveParam('velocityControl', 'Kp', 0.2)
      useParameterStore.getState().setSoftDriveParam('velocityControl', 'Kp_area', 0.3)

      const base = useParameterStore.getState().getConvertedParams('base')
      const area = useParameterStore.getState().getConvertedParams('area')

      expect(base!.velocityControl.Kp).toBeCloseTo(0.2 * 314 * 5.4, 2)
      expect(area!.velocityControl.Kp).toBeCloseTo(0.3 * 314 * 5.4, 2)
    })

    it('defaults to the base variant', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setMagnetPlateType('AT9001_0450')
      expect(useParameterStore.getState().getConvertedParams()).toEqual(
        useParameterStore.getState().getConvertedParams('base')
      )
    })

    it('returns null for the area variant when nothing is imported', () => {
      expect(useParameterStore.getState().getConvertedParams('area')).toBeNull()
    })
  })

  describe('hasAreaSet', () => {
    it('is false before anything is imported', () => {
      expect(useParameterStore.getState().hasAreaSet()).toBe(false)
    })

    it('is true for the defaults, which use *_AREA loop types', () => {
      useParameterStore.getState().loadDefaults()
      expect(useParameterStore.getState().hasAreaSet()).toBe(true)
    })

    it('is false once every area indicator is cleared', () => {
      useParameterStore.getState().loadDefaults()
      useParameterStore.getState().setSoftDriveParam('positionControl', 'PositionLoopType', 'P_POSITION_STANDSTILL')
      useParameterStore.getState().setSoftDriveParam('velocityControl', 'VelocityLoopType', 'PI_VELOCITY_STANDSTILL')
      useParameterStore.getState().setSoftDriveParam('feedForward', 'FeedforwardType', 'FFT_ON')
      useParameterStore.getState().setSoftDriveParam('filter', 'Usage', 'ALWAYS')

      expect(useParameterStore.getState().hasAreaSet()).toBe(false)
    })

    it('is true when the imported file has an enabled control area', () => {
      const xml = `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues>
      <Value><Name>ControlAreas[0].IsEnabled</Name><EnumText>TRUE</EnumText></Value>
      <Value><Name>ControlAreas[0].StartPosition</Name><Value>100</Value></Value>
      <Value><Name>ControlAreas[0].EndPosition</Name><Value>200</Value></Value>
      <Value><Name>ControlAreas[0].TransitionLength</Name><Value>10</Value></Value>
    </ParameterValues>
    <ParameterSets>
      <ParameterSet><TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId><ParameterValues>
        <Value><Name>PositionLoopType</Name><EnumText>P_POSITION_STANDSTILL</EnumText></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId><ParameterValues>
        <Value><Name>VelocityLoopType</Name><EnumText>PI_VELOCITY_STANDSTILL</EnumText></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId><ParameterValues>
        <Value><Name>ConfigurationFilter.Usage</Name><EnumText>ALWAYS</EnumText></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId><ParameterValues>
        <Value><Name>FeedforwardType</Name><EnumText>FFT_ON</EnumText></Value>
      </ParameterValues></ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

      useParameterStore.getState().importFromFile(xml, 'areas.xml')

      expect(useParameterStore.getState().controlAreas).toEqual([
        { index: 0, startPosition: 100, endPosition: 200, transitionLength: 10 },
      ])
      expect(useParameterStore.getState().hasAreaSet()).toBe(true)
    })
  })

  describe('import metadata', () => {
    it('records the file name and detected format', () => {
      const xti = `<?xml version="1.0"?>
<TcSmItem ClassName="CNcAxisDef"><Axis>
  <Module><TmcDesc GUID="{272A98C0-4C87-4243-BED6-3BB69E29F02C}"><ParameterValues /></TmcDesc>
    <Module><TmcDesc GUID="{13ED0DF8-3244-45E9-B3BA-89C339E4DFF3}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{8D695A14-7DB9-4D35-A64A-30D334B5E2D3}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{1A7898EF-F86A-4B73-8DF4-2E8199B711BA}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{CCE414CE-CCCB-4126-B90C-5D2688AF5025}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{3B51FB30-AC26-40E9-AFB9-E5ADED4491AC}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{68AA515C-6BA6-4D3E-86A0-1A3EB553CF37}"><ParameterValues /></TmcDesc></Module>
  </Module>
</Axis></TcSmItem>`

      useParameterStore.getState().importFromFile(xti, 'Mover Axis 1.xti')

      const state = useParameterStore.getState()
      expect(state.validationErrors).toEqual([])
      expect(state.sourceFormat).toBe('moverAxisXti')
      expect(state.sourceFileName).toBe('Mover Axis 1.xti')
      expect(state.softDriveParams).not.toBeNull()
    })

    it('clears the source metadata when loading defaults', () => {
      useParameterStore.getState().loadDefaults()
      const state = useParameterStore.getState()
      expect(state.sourceFormat).toBeNull()
      expect(state.sourceFileName).toBeNull()
      expect(state.controlAreas).toEqual([])
    })
  })

  describe('magnet plate detection', () => {
    /** Minimal valid source whose TorqueConstant identifies AT9001-0550 (force factor 7.7). */
    const sourceWithTorqueConstant = (torqueConstant: number) => `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues>
      <Value><Name>SoftDriveMotorPara.TorqueConstant</Name><Value>${torqueConstant}</Value></Value>
    </ParameterValues>
    <ParameterSets>
      <ParameterSet><TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId><ParameterValues /></ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

    it('selects the plate matching the motor torque constant', () => {
      useParameterStore.getState().importFromFile(sourceWithTorqueConstant(7.7), 'mover.xml')

      const state = useParameterStore.getState()
      expect(state.selectedMagnetPlateType).toBe('AT9001_0550')
      expect(state.magnetPlateDetected).toBe(true)
    })

    it('selects nothing when the torque constant matches no plate', () => {
      useParameterStore.getState().importFromFile(sourceWithTorqueConstant(8), 'mover.xml')

      const state = useParameterStore.getState()
      expect(state.selectedMagnetPlateType).toBeNull()
      expect(state.magnetPlateDetected).toBe(false)
    })

    it('never overrides a plate the user already chose', () => {
      useParameterStore.getState().setMagnetPlateType('AT9001_0AA0')
      useParameterStore.getState().importFromFile(sourceWithTorqueConstant(7.7), 'mover.xml')

      const state = useParameterStore.getState()
      expect(state.selectedMagnetPlateType).toBe('AT9001_0AA0')
      expect(state.magnetPlateDetected).toBe(false)
    })

    it('clears the detected flag once the user picks a plate', () => {
      useParameterStore.getState().importFromFile(sourceWithTorqueConstant(7.7), 'mover.xml')
      expect(useParameterStore.getState().magnetPlateDetected).toBe(true)

      useParameterStore.getState().setMagnetPlateType('AT9001_0775')

      const state = useParameterStore.getState()
      expect(state.selectedMagnetPlateType).toBe('AT9001_0775')
      expect(state.magnetPlateDetected).toBe(false)
    })

    it('clears the flag on reset and on loadDefaults', () => {
      useParameterStore.getState().importFromFile(sourceWithTorqueConstant(7.7), 'mover.xml')
      useParameterStore.getState().resetParameters()
      expect(useParameterStore.getState().magnetPlateDetected).toBe(false)
      expect(useParameterStore.getState().selectedMagnetPlateType).toBeNull()

      useParameterStore.getState().importFromFile(sourceWithTorqueConstant(7.7), 'mover.xml')
      useParameterStore.getState().loadDefaults()
      expect(useParameterStore.getState().magnetPlateDetected).toBe(false)
    })
  })
})
