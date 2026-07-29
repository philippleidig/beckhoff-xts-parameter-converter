import { CONVERSION_CONSTANT } from '@/lib/constants/magnetPlateTypes'
import type {
  SoftDriveParameters,
  MoverControllerParameters,
} from './types'

/** Map SoftDrive Area enum values to their MoverController (non-Area) equivalents. */
const AREA_TO_NON_AREA: Record<string, string> = {
  P_POSITION_STANDSTILL_AREA: 'P_POSITION_STANDSTILL',
  PI_VELOCITY_STANDSTILL_AREA: 'PID_VELOCITY_STANDSTILL',
  FFT_ON_AREA: 'FFT_ON',
}

function mapAreaType(value: string): string {
  return AREA_TO_NON_AREA[value] ?? value
}

/**
 * The MoverController velocity loop is a PID loop and its enum is named accordingly:
 * `PID_VELOCITY` where the SoftDrive says `PI_VELOCITY`. Writing the SoftDrive spelling
 * into a parameter set would produce an enum value the driver does not know.
 */
const VELOCITY_LOOP_TYPE_MAP: Record<string, string> = {
  PI_VELOCITY: 'PID_VELOCITY',
  PI_VELOCITY_STANDSTILL: 'PID_VELOCITY_STANDSTILL',
}

function mapVelocityLoopType(value: string): string {
  const nonArea = mapAreaType(value)
  return VELOCITY_LOOP_TYPE_MAP[nonArea] ?? nonArea
}

/**
 * Map SoftDrive filter types that no longer exist on the MoverController to
 * their equivalents. BIQUAD has been dropped from the MoverController; a
 * SoftDrive BIQUAD filter is converted to a NOTCH filter.
 */
const FILTER_TYPE_MAP: Record<string, string> = {
  BIQUAD: 'NOTCH',
}

function mapFilterType(value: string): string {
  return FILTER_TYPE_MAP[value] ?? value
}

/**
 * The SoftDrive stores OperationMode as a plain UDINT (8..11); the MoverController
 * uses an enum over the same numbers, so the values line up one to one.
 */
const OPERATION_MODE_MAP: Record<number, string> = {
  8: 'CyclicSynchronousPosition',
  9: 'CyclicSynchronousVelocity',
  10: 'CyclicSynchronousForce',
  11: 'CyclicSynchronousForceWithCommutationAngle',
}

function mapOperationMode(value: number): string {
  return OPERATION_MODE_MAP[value] ?? OPERATION_MODE_MAP[8]
}

/** SoftDrive uses an OFF/ON enum where the MoverController uses a BOOL. */
function mapOnOffToBool(value: string): string {
  return value === 'ON' ? 'TRUE' : 'FALSE'
}

export function convertParameters(
  source: SoftDriveParameters,
  forceFactor: number
): MoverControllerParameters {
  return {
    general: convertGeneral(source),
    encoder: convertEncoder(source),
    positionControl: convertPositionControl(source),
    velocityControl: convertVelocityControl(source, forceFactor),
    filter: convertFilter(source),
    feedForward: convertFeedForward(source, forceFactor),
  }
}

function convertGeneral(source: SoftDriveParameters) {
  return {
    OperationMode: mapOperationMode(source.softDrive.OperationMode),
    EmergencyRamp: source.softDrive.EmergencyRamp,
    EmergencyTimeOut: source.softDrive.EmergencyTimeOut,
    StandstillSwitchTime: source.softDrive.StandstillSwitchTime,
    StandstillSwitchMode: source.softDrive.StandstillSwitchMode,
    InterpolatorType: source.interpolator.InterpolatorType,
    CurrentChangeLimit: source.feedForward.CurrentChangeLimit,
    PhaseAdvance: source.feedForward.PhaseAdvanceAngle / 18,
  }
}

function convertEncoder(source: SoftDriveParameters) {
  return {
    VelocityFeedbackMode: source.encoder.VelocityFeedbackMode,
    PositionFeedbackMode: source.encoder.PositionFeedbackMode,
    PositionLowPassFilter: source.encoder.PositionLowPassFilter,
    VelocityFilterBandwidth: source.encoder.VelocityFilterBandwidth,
    ObserverCorrectionFactor: source.encoder.CorrectionFactor / 0.35,
    CommutationErrorVelocity: source.encoder.CommutationErrorVelocity,
  }
}

function convertPositionControl(source: SoftDriveParameters) {
  return {
    PositionLoopType: mapAreaType(source.positionControl.PositionLoopType),
    Kp: source.positionControl.Kp,
    Kp_standstill: source.positionControl.Kp_standstill,
    PositionLoopFilter: source.positionControl.PosLoopFilter,
    InpositionTn: source.positionControl.InpositionTn,
  }
}

function convertVelocityControl(source: SoftDriveParameters, forceFactor: number) {
  return {
    VelocityLoopType: mapVelocityLoopType(source.velocityControl.VelocityLoopType),
    Kp: source.velocityControl.Kp * CONVERSION_CONSTANT * forceFactor,
    Kp_standstill: source.velocityControl.Kp_standstill * CONVERSION_CONSTANT * forceFactor,
    Tn: source.velocityControl.Tn,
    Tn_standstill: source.velocityControl.Tn_standstill,
    Kd: source.velocityControl.Kd * forceFactor,
    Kd_standstill: source.velocityControl.Kd_standstill * forceFactor,
    ResetIPartAtMotionStart: mapOnOffToBool(source.velocityControl.ResetIPartAtMotionStart),
    ResetIPartWithBipolarForceLimitChange: mapOnOffToBool(source.velocityControl.ResetIPartWithBipolarCurrentLimitChange),
    ResetIPartWithFollErrorSignChangeAndBipolarForceLimit: mapOnOffToBool(
      source.velocityControl.ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit
    ),
    MaxVelocity: source.velocityControl.MaxVelocity,
  }
}

function convertFilter(source: SoftDriveParameters) {
  return {
    Type: mapFilterType(source.filter.Type),
    LowPassFrequency: source.filter.LowPassFrequency,
    LowPassDamping: source.filter.LowPassDamping,
    HighPassFrequency: source.filter.HighPassFrequency,
    HighPassDamping: source.filter.HighPassDamping,
  }
}

function convertFeedForward(source: SoftDriveParameters, forceFactor: number) {
  return {
    Type: mapAreaType(source.feedForward.FeedforwardType),
    KpAccFFT: source.feedForward.KpAccFFT * 0.35,
    FrictionCompensation: source.feedForward.FrictionCompensation * forceFactor,
    DetectionMinMovement: source.feedForward.DetectionMinMovement,
    DetectionFilter: source.feedForward.DetectionFilter,
    DetectionForceRamp: source.feedForward.DetectionCurrentRamp * forceFactor,
    DetectionMaxForceLimitFactor: source.feedForward.DetectionMaxCurrent / 12,
  }
}
