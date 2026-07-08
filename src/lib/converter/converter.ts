import { CONVERSION_CONSTANT } from '@/lib/constants/moverTypes'
import type {
  SoftDriveParameters,
  MoverControllerParameters,
} from './types'

/** Map SoftDrive Area enum values to their MoverController (non-Area) equivalents. */
const AREA_TO_NON_AREA: Record<string, string> = {
  P_POSITION_STANDSTILL_AREA: 'P_POSITION_STANDSTILL',
  PI_VELOCITY_STANDSTILL_AREA: 'PI_VELOCITY_STANDSTILL',
  FFT_ON_AREA: 'FFT_ON',
}

function mapAreaType(value: string): string {
  return AREA_TO_NON_AREA[value] ?? value
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

export function convertParameters(
  source: SoftDriveParameters,
  forceFactor: number
): MoverControllerParameters {
  return {
    general: convertGeneral(source, forceFactor),
    encoder: convertEncoder(source),
    positionControl: convertPositionControl(source),
    velocityControl: convertVelocityControl(source, forceFactor),
    filter: convertFilter(source),
    feedForward: convertFeedForward(source, forceFactor),
  }
}

function convertGeneral(source: SoftDriveParameters, _forceFactor: number) {
  return {
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
    VelocityLoopType: mapAreaType(source.velocityControl.VelocityLoopType),
    Kp: source.velocityControl.Kp * CONVERSION_CONSTANT * forceFactor,
    Kp_standstill: source.velocityControl.Kp_standstill * CONVERSION_CONSTANT * forceFactor,
    Tn: source.velocityControl.Tn,
    Tn_standstill: source.velocityControl.Tn_standstill,
    Kd: source.velocityControl.Kd * forceFactor,
    Kd_standstill: source.velocityControl.Kd_standstill * forceFactor,
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
