import type { SoftDriveParameters, MoverControllerParameters } from './types'

export function createDefaultSoftDriveParameters(): SoftDriveParameters {
  return {
    softDrive: {
      OperationMode: 8,
      EmergencyRamp: 10000,
      EmergencyTimeOut: 0.5,
      StandstillSwitchTime: 0.1,
      StandstillSwitchMode: 'BLENDING_AFTER_SWITCHTIME',
      TorqueConstant: 0,
    },
    interpolator: {
      InterpolatorType: 'INTERPOLATION_POLYNOM3',
    },
    encoder: {
      VelocityFeedbackMode: 'OBSERVER',
      PositionFeedbackMode: 'MODULO_START_INVERT',
      PositionLowPassFilter: 500,
      VelocityFilterBandwidth: 160,
      CorrectionFactor: 0.5,
      SimulationOffset: 10,
      CommutationErrorVelocity: 1000,
    },
    positionControl: {
      PositionLoopType: 'P_POSITION_STANDSTILL',
      Kp: 0.05,
      Kp_standstill: 0.04,
      Kp_area: 0,
      Kp_area_standstill: 0,
      Kp_ffv: 1,
      PosLoopFilter: 75,
      PosLoopFilter_area: 75,
      InpositionTn: 0.05,
    },
    velocityControl: {
      VelocityLoopType: 'PI_VELOCITY_STANDSTILL_AREA',
      Kp: 0.1,
      Kp_standstill: 0.08,
      Kp_area: 0.1,
      Kp_area_standstill: 0.08,
      Tn: 0.1,
      Tn_standstill: 0.1,
      Tn_area: 0,
      Tn_area_standstill: 0.1,
      Kd: 0,
      Kd_standstill: 0,
      Kd_area: 0,
      Kd_area_standstill: 0,
      MaxVelocity: 4200,
      ResetIPartAtMotionStart: 'OFF',
      ResetIPartWithBipolarCurrentLimitChange: 'OFF',
      ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit: 'OFF',
    },
    filter: {
      Type: 'LOWPASS2',
      Usage: 'ALWAYS',
      LowPassFrequency: 336,
      LowPassDamping: 0.8,
      HighPassFrequency: 0,
      HighPassDamping: 0,
    },
    feedForward: {
      FeedforwardType: 'FFT_ON_AREA',
      KpAccFFT: 7,
      KpAccFFT_area: 7,
      FrictionCompensation: 0.6,
      FrictionCompensation_area: 0.6,
      KpVeloFFT: 0,
      OpenLoopMoveCurrent: 3,
      PhaseAdvanceAngle: 36,
      PhaseAdvanceSpeed: 4000,
      CommutationFilter: 0,
      AreaCurrentLimit: 0,
      CurrentChangeLimit: 2,
      DetectionCurrentRamp: 25,
      DetectionMaxCurrent: 12,
      DetectionMinMovement: 0.1,
      DetectionFilter: 250,
    },
  }
}

/**
 * The MoverController values TwinCAT writes into a freshly created parameter set.
 *
 * Transcribed from the export template (`scripts/lib/__fixtures__/template-4.4.22.0.xti`), which is an
 * untouched TwinCAT export — comparing an imported set against these values shows
 * exactly what has been tuned away from the factory state.
 */
export function createDefaultMoverControllerParameters(): MoverControllerParameters {
  return {
    general: {
      OperationMode: 'CyclicSynchronousPosition',
      EmergencyRamp: 10000,
      EmergencyTimeOut: 0.5,
      StandstillSwitchTime: 0.1,
      StandstillSwitchMode: 'BLENDING_AFTER_SWITCHTIME',
      InterpolatorType: 'INTERPOLATION_POLYNOM3',
      CurrentChangeLimit: 2,
      PhaseAdvance: 3,
    },
    encoder: {
      VelocityFeedbackMode: 'OBSERVER',
      PositionFeedbackMode: 'MODULO_START',
      PositionLowPassFilter: 500,
      VelocityFilterBandwidth: 160,
      ObserverCorrectionFactor: 1,
      CommutationErrorVelocity: 1000,
    },
    positionControl: {
      PositionLoopType: 'P_POSITION_STANDSTILL',
      Kp: 0.03,
      Kp_standstill: 0.02,
      PositionLoopFilter: 75,
      InpositionTn: 0.05,
    },
    velocityControl: {
      VelocityLoopType: 'PID_VELOCITY_STANDSTILL',
      Kp: 120.9,
      Kp_standstill: 80,
      Tn: 0.05,
      Tn_standstill: 0.05,
      Kd: 0,
      Kd_standstill: 0,
      ResetIPartAtMotionStart: 'FALSE',
      ResetIPartWithBipolarForceLimitChange: 'FALSE',
      ResetIPartWithFollErrorSignChangeAndBipolarForceLimit: 'FALSE',
      MaxVelocity: 4200,
    },
    filter: {
      Type: 'LOWPASS2',
      LowPassFrequency: 250,
      LowPassDamping: 0.8,
      HighPassFrequency: 0,
      HighPassDamping: 0,
    },
    feedForward: {
      Type: 'FFT_ON',
      KpAccFFT: 0.5,
      FrictionCompensation: 0,
      DetectionMinMovement: 0.1,
      DetectionFilter: 250,
      DetectionForceRamp: 195,
      DetectionMaxForceLimitFactor: 1,
    },
  }
}
