import { describe, it, expect } from 'vitest'
import { parseSoftDriveXml } from './parser'

const SAMPLE_XML = `<?xml version="1.0" encoding="utf-8"?>
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
                <ParameterValues>
                  <Value><Name>InterpolatorType</Name><EnumText>INTERPOLATION_POLYNOM3</EnumText></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId>
                <ParameterValues>
                  <Value><Name>VelocityFeedbackMode</Name><EnumText>OBSERVER</EnumText></Value>
                  <Value><Name>PositionFeedbackMode</Name><EnumText>MODULO_START_INVERT</EnumText></Value>
                  <Value><Name>PositionLowPassFilter</Name><Value>500</Value></Value>
                  <Value><Name>VelocityFilterBandwidth</Name><Value>179</Value></Value>
                  <Value><Name>CorrectionFactor</Name><Value>0.5</Value></Value>
                  <Value><Name>SimulationOffset</Name><Value>10</Value></Value>
                  <Value><Name>CommutationErrorVelocity</Name><Value>1000</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId>
                <ParameterValues>
                  <Value><Name>PositionLoopType</Name><EnumText>P_POSITION_STANDSTILL</EnumText></Value>
                  <Value><Name>Kp</Name><Value>0.05</Value></Value>
                  <Value><Name>Kp_standstill</Name><Value>0.04</Value></Value>
                  <Value><Name>Kp_area</Name><Value>0</Value></Value>
                  <Value><Name>Kp_area_standstill</Name><Value>0</Value></Value>
                  <Value><Name>Kp_ffv</Name><Value>1</Value></Value>
                  <Value><Name>PosLoopFilter</Name><Value>75</Value></Value>
                  <Value><Name>PosLoopFilter_area</Name><Value>75</Value></Value>
                  <Value><Name>InpositionTn</Name><Value>0.05</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId>
                <ParameterValues>
                  <Value><Name>VelocityLoopType</Name><EnumText>PI_VELOCITY_STANDSTILL_AREA</EnumText></Value>
                  <Value><Name>Kp</Name><Value>0.1</Value></Value>
                  <Value><Name>Kp_standstill</Name><Value>0.08</Value></Value>
                  <Value><Name>Kp_area</Name><Value>0.1</Value></Value>
                  <Value><Name>Kp_area_standstill</Name><Value>0.08</Value></Value>
                  <Value><Name>Tn</Name><Value>0.1</Value></Value>
                  <Value><Name>Tn_standstill</Name><Value>0.1</Value></Value>
                  <Value><Name>Tn_area</Name><Value>0</Value></Value>
                  <Value><Name>Tn_area_standstill</Name><Value>0.1</Value></Value>
                  <Value><Name>MaxVelocity</Name><Value>4200</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId>
                <ParameterValues>
                  <Value><Name>ConfigurationFilter.Type</Name><EnumText>LOWPASS2</EnumText></Value>
                  <Value><Name>ConfigurationFilter.Usage</Name><EnumText>ALWAYS</EnumText></Value>
                  <Value><Name>ConfigurationFilter.LowPassFrequency</Name><Value>336</Value></Value>
                  <Value><Name>ConfigurationFilter.LowPassDamping</Name><Value>0.8</Value></Value>
                  <Value><Name>ConfigurationFilter.HighPassFrequency</Name><Value>0</Value></Value>
                  <Value><Name>ConfigurationFilter.HighPassDamping</Name><Value>0</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId>
                <ParameterValues>
                  <Value><Name>FeedforwardType</Name><EnumText>FFT_ON_AREA</EnumText></Value>
                  <Value><Name>KpAccFFT</Name><Value>7</Value></Value>
                  <Value><Name>KpAccFFT_area</Name><Value>7</Value></Value>
                  <Value><Name>FrictionCompensation</Name><Value>0.6</Value></Value>
                  <Value><Name>FrictionCompensation_area</Name><Value>0.6</Value></Value>
                  <Value><Name>KpVeloFFT</Name><Value>0</Value></Value>
                  <Value><Name>OpenLoopMoveCurrent</Name><Value>3</Value></Value>
                  <Value><Name>PhaseAdvanceAngle</Name><Value>36</Value></Value>
                  <Value><Name>PhaseAdvanceSpeed</Name><Value>4000</Value></Value>
                  <Value><Name>CommutationFilter</Name><Value>0</Value></Value>
                  <Value><Name>AreaCurrentLimit</Name><Value>0</Value></Value>
                  <Value><Name>CurrentChangeLimit</Name><Value>2</Value></Value>
                  <Value><Name>DetectionCurrentRamp</Name><Value>25</Value></Value>
                  <Value><Name>DetectionMaxCurrent</Name><Value>12</Value></Value>
                  <Value><Name>DetectionMinMovement</Name><Value>0.1</Value></Value>
                  <Value><Name>DetectionFilter</Name><Value>250</Value></Value>
                </ParameterValues>
              </ParameterSet>
            </ParameterSets>
          </ParameterSet>
        </ParameterSets>
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

describe('parseSoftDriveXml', () => {
  it('parses a complete XML correctly', () => {
    const { params } = parseSoftDriveXml(SAMPLE_XML)

    // Interpolator
    expect(params.interpolator.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')

    // Encoder
    expect(params.encoder.VelocityFeedbackMode).toBe('OBSERVER')
    expect(params.encoder.PositionFeedbackMode).toBe('MODULO_START_INVERT')
    expect(params.encoder.PositionLowPassFilter).toBe(500)
    expect(params.encoder.VelocityFilterBandwidth).toBe(179)
    expect(params.encoder.CorrectionFactor).toBe(0.5)
    expect(params.encoder.SimulationOffset).toBe(10)
    expect(params.encoder.CommutationErrorVelocity).toBe(1000)

    // Position Control
    expect(params.positionControl.PositionLoopType).toBe('P_POSITION_STANDSTILL')
    expect(params.positionControl.Kp).toBe(0.05)
    expect(params.positionControl.Kp_standstill).toBe(0.04)
    expect(params.positionControl.PosLoopFilter).toBe(75)
    expect(params.positionControl.InpositionTn).toBe(0.05)

    // Velocity Control
    expect(params.velocityControl.VelocityLoopType).toBe('PI_VELOCITY_STANDSTILL_AREA')
    expect(params.velocityControl.Kp).toBe(0.1)
    expect(params.velocityControl.Kp_standstill).toBe(0.08)
    expect(params.velocityControl.Tn).toBe(0.1)
    expect(params.velocityControl.MaxVelocity).toBe(4200)

    // Filter
    expect(params.filter.Type).toBe('LOWPASS2')
    expect(params.filter.LowPassFrequency).toBe(336)
    expect(params.filter.LowPassDamping).toBe(0.8)

    // Feed Forward
    expect(params.feedForward.FeedforwardType).toBe('FFT_ON_AREA')
    expect(params.feedForward.KpAccFFT).toBe(7)
    expect(params.feedForward.FrictionCompensation).toBe(0.6)
    expect(params.feedForward.PhaseAdvanceAngle).toBe(36)
    expect(params.feedForward.CurrentChangeLimit).toBe(2)
    expect(params.feedForward.DetectionCurrentRamp).toBe(25)
    expect(params.feedForward.DetectionMaxCurrent).toBe(12)
    expect(params.feedForward.DetectionMinMovement).toBe(0.1)
    expect(params.feedForward.DetectionFilter).toBe(250)
  })

  it('throws on invalid XML', () => {
    expect(() => parseSoftDriveXml('<not valid')).toThrow()
  })

  it('throws when SoftDrive ParameterSet is missing', () => {
    const xml = `<?xml version="1.0"?><ParameterExport><ParameterSet><TypeId>Other</TypeId></ParameterSet></ParameterExport>`
    expect(() => parseSoftDriveXml(xml)).toThrow('No SoftDrive ParameterSet')
  })

  it('falls back to defaults for missing parameters', () => {
    const minimalXml = `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues />
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
    const { params } = parseSoftDriveXml(minimalXml)

    // Should use defaults
    expect(params.interpolator.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    expect(params.encoder.CorrectionFactor).toBe(0.5)
    expect(params.velocityControl.MaxVelocity).toBe(4200)
    expect(params.feedForward.DetectionFilter).toBe(250)
  })

  it('parses XML with GUID-based SoftDrive TypeId', () => {
    const guidXml = `<?xml version="1.0" encoding="utf-8"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>0da6877c-6a68-48ee-8003-c0a2209ceb78</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet>
        <TypeId>Axis</TypeId>
        <ParameterSets>
          <ParameterSet>
            <Name>SoftDrive 1 - Parameter Set</Name>
            <TypeId>272a98c0-4c87-4243-bed6-3bb69e29f02c</TypeId>
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
                  <Value><Name>VelocityFeedbackMode</Name><EnumText>OBSERVER</EnumText></Value>
                  <Value><Name>PositionLowPassFilter</Name><Value>500</Value></Value>
                  <Value><Name>VelocityFilterBandwidth</Name><Value>300</Value></Value>
                  <Value><Name>CorrectionFactor</Name><Value>0.5</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId>
                <ParameterValues>
                  <Value><Name>Kp</Name><Value>0.03</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId>
                <ParameterValues>
                  <Value><Name>Kp</Name><Value>0.07</Value></Value>
                  <Value><Name>MaxVelocity</Name><Value>4200</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId>
                <ParameterValues>
                  <Value><Name>ConfigurationFilter.LowPassFrequency</Name><Value>350</Value></Value>
                </ParameterValues>
              </ParameterSet>
              <ParameterSet>
                <TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId>
                <ParameterValues>
                  <Value><Name>KpAccFFT</Name><Value>1.5</Value></Value>
                </ParameterValues>
              </ParameterSet>
            </ParameterSets>
          </ParameterSet>
        </ParameterSets>
      </ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`
    const { params } = parseSoftDriveXml(guidXml)

    expect(params.interpolator.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    expect(params.encoder.VelocityFeedbackMode).toBe('OBSERVER')
    expect(params.encoder.VelocityFilterBandwidth).toBe(300)
    expect(params.positionControl.Kp).toBe(0.03)
    expect(params.velocityControl.Kp).toBe(0.07)
    expect(params.velocityControl.MaxVelocity).toBe(4200)
    expect(params.filter.LowPassFrequency).toBe(350)
    expect(params.feedForward.KpAccFFT).toBe(1.5)
  })

  it('falls back to defaults when module ParameterSets are missing', () => {
    const xml = `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues />
    <ParameterSets></ParameterSets>
  </ParameterSet>
</ParameterExport>`
    const { params } = parseSoftDriveXml(xml)

    // All values should come from defaults
    expect(params.interpolator.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    expect(params.encoder.VelocityFeedbackMode).toBe('OBSERVER')
    expect(params.positionControl.Kp).toBe(0.05)
  })
})

describe('parseSoftDriveXml - Mover Axis XTI', () => {
  /**
   * Condensed version of samples/Mover_Axis_1.xti: the SoftDrive module holds the
   * ControlAreas, its six sub-modules are nested Module elements identified by the
   * GUID attribute of their TmcDesc.
   */
  const XTI = `<?xml version="1.0"?>
<TcSmItem xsi:noNamespaceSchemaLocation="http://www.beckhoff.com/schemas/2012/07/TcSmProject"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ClassName="CNcAxisDef">
  <Axis>
    <Module Id="#x01010010">
      <Name>SoftDrive 1</Name>
      <TmcDesc GUID="{272A98C0-4C87-4243-BED6-3BB69E29F02C}">
        <ParameterValues>
          <Value><Name>HardwareModulo</Name><Value>3000</Value></Value>
          <Value><Name>ControlAreas[0].IsEnabled</Name><EnumText>TRUE</EnumText></Value>
          <Value><Name>ControlAreas[0].StartPosition</Name><Value>5555</Value></Value>
          <Value><Name>ControlAreas[0].EndPosition</Name><Value>6000</Value></Value>
          <Value><Name>ControlAreas[0].TransitionLength</Name><Value>25</Value></Value>
          <Value><Name>ControlAreas[1].IsEnabled</Name><EnumText>FALSE</EnumText></Value>
          <Value><Name>ControlAreas[1].StartPosition</Name><Value>0</Value></Value>
        </ParameterValues>
      </TmcDesc>
      <Module Id="#x01010020">
        <TmcDesc GUID="{13ED0DF8-3244-45E9-B3BA-89C339E4DFF3}">
          <ParameterValues>
            <Value><Name>InterpolatorType</Name><EnumText>INTERPOLATION_POLYNOM3</EnumText></Value>
          </ParameterValues>
        </TmcDesc>
      </Module>
      <Module Id="#x01010030">
        <TmcDesc GUID="{8D695A14-7DB9-4D35-A64A-30D334B5E2D3}">
          <ParameterValues>
            <Value><Name>VelocityFeedbackMode</Name><EnumText>OBSERVER</EnumText></Value>
            <Value><Name>PositionFeedbackMode</Name><EnumText>MODULO_START</EnumText></Value>
            <Value><Name>PositionLowPassFilter</Name><Value>500</Value></Value>
            <Value><Name>VelocityFilterBandwidth</Name><Value>160</Value></Value>
            <Value><Name>CorrectionFactor</Name><Value>0.5</Value></Value>
            <Value><Name>SimulationOffset</Name><Value>10</Value></Value>
            <Value><Name>CommutationErrorVelocity</Name><Value>1000</Value></Value>
          </ParameterValues>
        </TmcDesc>
      </Module>
      <Module Id="#x01010040">
        <TmcDesc GUID="{1A7898EF-F86A-4B73-8DF4-2E8199B711BA}">
          <ParameterValues>
            <Value><Name>PositionLoopType</Name><EnumText>P_POSITION_STANDSTILL</EnumText></Value>
            <Value><Name>Kp</Name><Value>0.05</Value></Value>
            <Value><Name>Kp_area</Name><Value>0.04</Value></Value>
            <Value><Name>PosLoopFilter</Name><Value>75</Value></Value>
          </ParameterValues>
        </TmcDesc>
      </Module>
      <Module Id="#x01010050">
        <TmcDesc GUID="{CCE414CE-CCCB-4126-B90C-5D2688AF5025}">
          <ParameterValues>
            <Value><Name>VelocityLoopType</Name><EnumText>PI_VELOCITY_STANDSTILL</EnumText></Value>
            <Value><Name>Kp</Name><Value>0.05</Value></Value>
            <Value><Name>Kp_standstill</Name><Value>0.033</Value></Value>
            <Value><Name>Kp_area</Name><Value>0.04</Value></Value>
            <Value><Name>Kp_area_standstill</Name><Value>0.03</Value></Value>
            <Value><Name>Tn</Name><Value>0.05</Value></Value>
            <Value><Name>MaxVelocity</Name><Value>4200</Value></Value>
          </ParameterValues>
        </TmcDesc>
      </Module>
      <Module Id="#x01010060">
        <TmcDesc GUID="{3B51FB30-AC26-40E9-AFB9-E5ADED4491AC}">
          <ParameterValues>
            <Value><Name>ConfigurationFilter.Type</Name><EnumText>LOWPASS2</EnumText></Value>
            <Value><Name>ConfigurationFilter.Usage</Name><EnumText>ALWAYS</EnumText></Value>
            <Value><Name>ConfigurationFilter.LowPassFrequency</Name><Value>250</Value></Value>
            <Value><Name>ConfigurationFilter.LowPassDamping</Name><Value>0.8</Value></Value>
          </ParameterValues>
        </TmcDesc>
      </Module>
      <Module Id="#x01010070">
        <TmcDesc GUID="{68AA515C-6BA6-4D3E-86A0-1A3EB553CF37}">
          <ParameterValues>
            <Value><Name>FeedforwardType</Name><EnumText>FFT_ON</EnumText></Value>
            <Value><Name>KpAccFFT</Name><Value>1</Value></Value>
            <Value><Name>KpAccFFT_area</Name><Value>1</Value></Value>
            <Value><Name>PhaseAdvanceAngle</Name><Value>36</Value></Value>
            <Value><Name>CurrentChangeLimit</Name><Value>2</Value></Value>
            <Value><Name>DetectionMaxCurrent</Name><Value>12</Value></Value>
          </ParameterValues>
        </TmcDesc>
      </Module>
    </Module>
  </Axis>
</TcSmItem>`

  it('reports the moverAxisXti format', () => {
    expect(parseSoftDriveXml(XTI).format).toBe('moverAxisXti')
  })

  it('parses all six modules from the XTI structure', () => {
    const { params } = parseSoftDriveXml(XTI)

    expect(params.interpolator.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    expect(params.encoder.PositionFeedbackMode).toBe('MODULO_START')
    expect(params.encoder.PositionLowPassFilter).toBe(500)
    expect(params.encoder.VelocityFilterBandwidth).toBe(160)
    expect(params.encoder.CorrectionFactor).toBe(0.5)
    expect(params.positionControl.PositionLoopType).toBe('P_POSITION_STANDSTILL')
    expect(params.velocityControl.Kp).toBe(0.05)
    expect(params.velocityControl.Kp_standstill).toBe(0.033)
    expect(params.velocityControl.Kp_area).toBe(0.04)
    expect(params.velocityControl.MaxVelocity).toBe(4200)
    expect(params.filter.Type).toBe('LOWPASS2')
    expect(params.filter.Usage).toBe('ALWAYS')
    expect(params.filter.LowPassFrequency).toBe(250)
    expect(params.feedForward.FeedforwardType).toBe('FFT_ON')
    expect(params.feedForward.PhaseAdvanceAngle).toBe(36)
  })

  it('reads the enabled control areas from the SoftDrive root', () => {
    expect(parseSoftDriveXml(XTI).controlAreas).toEqual([
      { index: 0, startPosition: 5555, endPosition: 6000, transitionLength: 25 },
    ])
  })

  it('produces the same parameters as the equivalent ParameterExport XML', () => {
    const equivalentXml = `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues />
    <ParameterSets>
      <ParameterSet><TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId><ParameterValues>
        <Value><Name>InterpolatorType</Name><EnumText>INTERPOLATION_POLYNOM3</EnumText></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId><ParameterValues>
        <Value><Name>VelocityFeedbackMode</Name><EnumText>OBSERVER</EnumText></Value>
        <Value><Name>PositionFeedbackMode</Name><EnumText>MODULO_START</EnumText></Value>
        <Value><Name>PositionLowPassFilter</Name><Value>500</Value></Value>
        <Value><Name>VelocityFilterBandwidth</Name><Value>160</Value></Value>
        <Value><Name>CorrectionFactor</Name><Value>0.5</Value></Value>
        <Value><Name>SimulationOffset</Name><Value>10</Value></Value>
        <Value><Name>CommutationErrorVelocity</Name><Value>1000</Value></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId><ParameterValues>
        <Value><Name>PositionLoopType</Name><EnumText>P_POSITION_STANDSTILL</EnumText></Value>
        <Value><Name>Kp</Name><Value>0.05</Value></Value>
        <Value><Name>Kp_area</Name><Value>0.04</Value></Value>
        <Value><Name>PosLoopFilter</Name><Value>75</Value></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId><ParameterValues>
        <Value><Name>VelocityLoopType</Name><EnumText>PI_VELOCITY_STANDSTILL</EnumText></Value>
        <Value><Name>Kp</Name><Value>0.05</Value></Value>
        <Value><Name>Kp_standstill</Name><Value>0.033</Value></Value>
        <Value><Name>Kp_area</Name><Value>0.04</Value></Value>
        <Value><Name>Kp_area_standstill</Name><Value>0.03</Value></Value>
        <Value><Name>Tn</Name><Value>0.05</Value></Value>
        <Value><Name>MaxVelocity</Name><Value>4200</Value></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId><ParameterValues>
        <Value><Name>ConfigurationFilter.Type</Name><EnumText>LOWPASS2</EnumText></Value>
        <Value><Name>ConfigurationFilter.Usage</Name><EnumText>ALWAYS</EnumText></Value>
        <Value><Name>ConfigurationFilter.LowPassFrequency</Name><Value>250</Value></Value>
        <Value><Name>ConfigurationFilter.LowPassDamping</Name><Value>0.8</Value></Value>
      </ParameterValues></ParameterSet>
      <ParameterSet><TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId><ParameterValues>
        <Value><Name>FeedforwardType</Name><EnumText>FFT_ON</EnumText></Value>
        <Value><Name>KpAccFFT</Name><Value>1</Value></Value>
        <Value><Name>KpAccFFT_area</Name><Value>1</Value></Value>
        <Value><Name>PhaseAdvanceAngle</Name><Value>36</Value></Value>
        <Value><Name>CurrentChangeLimit</Name><Value>2</Value></Value>
        <Value><Name>DetectionMaxCurrent</Name><Value>12</Value></Value>
      </ParameterValues></ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

    expect(parseSoftDriveXml(XTI).params).toEqual(parseSoftDriveXml(equivalentXml).params)
  })
})

describe('parseSoftDriveXml - SoftDrive root parameters', () => {
  const withRoot = (rootValues: string, velocityValues = '') => `<?xml version="1.0"?>
<ParameterExport>
  <ParameterSet>
    <TypeId>SoftDrive</TypeId>
    <ParameterValues>${rootValues}</ParameterValues>
    <ParameterSets>
      <ParameterSet><TypeId>13ed0df8-3244-45e9-b3ba-89c339e4dff3</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>8d695a14-7db9-4d35-a64a-30d334b5e2d3</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>1a7898ef-f86a-4b73-8df4-2e8199b711ba</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>cce414ce-cccb-4126-b90c-5d2688af5025</TypeId><ParameterValues>${velocityValues}</ParameterValues></ParameterSet>
      <ParameterSet><TypeId>3b51fb30-ac26-40e9-afb9-e5aded4491ac</TypeId><ParameterValues /></ParameterSet>
      <ParameterSet><TypeId>68aa515c-6ba6-4d3e-86a0-1a3eb553cf37</TypeId><ParameterValues /></ParameterSet>
    </ParameterSets>
  </ParameterSet>
</ParameterExport>`

  it('reads the root values from a ParameterExport', () => {
    const { params } = parseSoftDriveXml(withRoot(`
      <Value><Name>OperationMode</Name><Value>10</Value></Value>
      <Value><Name>EmergencyRamp</Name><Value>40000</Value></Value>
      <Value><Name>EmergencyTimeOut</Name><Value>0.75</Value></Value>
      <Value><Name>StandstillSwitchTime</Name><Value>0.2</Value></Value>
      <Value><Name>StandstillSwitchMode</Name><EnumText>DIRECT_AT_SWITCHTIME</EnumText></Value>
      <Value><Name>SoftDriveMotorPara.TorqueConstant</Name><Value>7.7</Value></Value>`))

    expect(params.softDrive).toEqual({
      OperationMode: 10,
      EmergencyRamp: 40000,
      EmergencyTimeOut: 0.75,
      StandstillSwitchTime: 0.2,
      StandstillSwitchMode: 'DIRECT_AT_SWITCHTIME',
      TorqueConstant: 7.7,
    })
  })

  it('falls back to defaults for the older format, which lacks StandstillSwitchMode', () => {
    const { params } = parseSoftDriveXml(withRoot(`
      <Value><Name>EmergencyRamp</Name><Value>10000</Value></Value>`))

    expect(params.softDrive.StandstillSwitchMode).toBe('BLENDING_AFTER_SWITCHTIME')
    expect(params.softDrive.OperationMode).toBe(8)
    expect(params.softDrive.TorqueConstant).toBe(0)
    expect(params.velocityControl.ResetIPartAtMotionStart).toBe('OFF')
  })

  it('reads the ResetIPart flags from the velocity control module', () => {
    const { params } = parseSoftDriveXml(withRoot('', `
      <Value><Name>ResetIPartAtMotionStart</Name><EnumText>ON</EnumText></Value>
      <Value><Name>ResetIPartWithBipolarCurrentLimitChange</Name><EnumText>ON</EnumText></Value>
      <Value><Name>ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit</Name><EnumText>OFF</EnumText></Value>`))

    expect(params.velocityControl.ResetIPartAtMotionStart).toBe('ON')
    expect(params.velocityControl.ResetIPartWithBipolarCurrentLimitChange).toBe('ON')
    expect(params.velocityControl.ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit).toBe('OFF')
  })

  it('reads the root values from a Mover Axis XTI too', () => {
    const xti = `<?xml version="1.0"?>
<TcSmItem ClassName="CNcAxisDef"><Axis>
  <Module><TmcDesc GUID="{272A98C0-4C87-4243-BED6-3BB69E29F02C}"><ParameterValues>
    <Value><Name>OperationMode</Name><Value>8</Value></Value>
    <Value><Name>EmergencyRamp</Name><Value>12345</Value></Value>
    <Value><Name>StandstillSwitchMode</Name><EnumText>BLENDING_BEFORE_SWITCHTIME</EnumText></Value>
    <Value><Name>SoftDriveMotorPara.TorqueConstant</Name><Value>7.7</Value></Value>
  </ParameterValues></TmcDesc>
    <Module><TmcDesc GUID="{13ED0DF8-3244-45E9-B3BA-89C339E4DFF3}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{8D695A14-7DB9-4D35-A64A-30D334B5E2D3}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{1A7898EF-F86A-4B73-8DF4-2E8199B711BA}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{CCE414CE-CCCB-4126-B90C-5D2688AF5025}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{3B51FB30-AC26-40E9-AFB9-E5ADED4491AC}"><ParameterValues /></TmcDesc></Module>
    <Module><TmcDesc GUID="{68AA515C-6BA6-4D3E-86A0-1A3EB553CF37}"><ParameterValues /></TmcDesc></Module>
  </Module>
</Axis></TcSmItem>`

    const { params } = parseSoftDriveXml(xti)
    expect(params.softDrive.EmergencyRamp).toBe(12345)
    expect(params.softDrive.StandstillSwitchMode).toBe('BLENDING_BEFORE_SWITCHTIME')
    expect(params.softDrive.TorqueConstant).toBe(7.7)
  })
})
