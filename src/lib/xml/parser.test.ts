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
    const params = parseSoftDriveXml(SAMPLE_XML)

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
    const params = parseSoftDriveXml(minimalXml)

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
    const params = parseSoftDriveXml(guidXml)

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
    const params = parseSoftDriveXml(xml)

    // All values should come from defaults
    expect(params.interpolator.InterpolatorType).toBe('INTERPOLATION_POLYNOM3')
    expect(params.encoder.VelocityFeedbackMode).toBe('OBSERVER')
    expect(params.positionControl.Kp).toBe(0.05)
  })
})
