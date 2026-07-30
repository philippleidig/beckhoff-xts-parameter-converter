// ============================================================
// SoftDrive Parameter Types (Source)
// ============================================================

/** Parameters stored directly on the SoftDrive object, above the sub-modules. */
export interface SdSoftDrive {
  OperationMode: number
  EmergencyRamp: number
  EmergencyTimeOut: number
  StandstillSwitchTime: number
  StandstillSwitchMode: string
  /** Motor force constant. Identifies the magnet plate when it matches a force factor. */
  TorqueConstant: number
}

export interface SdInterpolator {
  InterpolatorType: string
}

export interface SdEncoder {
  VelocityFeedbackMode: string
  PositionFeedbackMode: string
  PositionLowPassFilter: number
  VelocityFilterBandwidth: number
  CorrectionFactor: number
  SimulationOffset: number
  CommutationErrorVelocity: number
}

export interface SdPositionControl {
  PositionLoopType: string
  Kp: number
  Kp_standstill: number
  Kp_area: number
  Kp_area_standstill: number
  Kp_ffv: number
  PosLoopFilter: number
  PosLoopFilter_area: number
  InpositionTn: number
}

export interface SdVelocityControl {
  VelocityLoopType: string
  Kp: number
  Kp_standstill: number
  Kp_area: number
  Kp_area_standstill: number
  Tn: number
  Tn_standstill: number
  Tn_area: number
  Tn_area_standstill: number
  Kd: number
  Kd_standstill: number
  Kd_area: number
  Kd_area_standstill: number
  MaxVelocity: number
  ResetIPartAtMotionStart: string
  ResetIPartWithBipolarCurrentLimitChange: string
  ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit: string
}

export interface SdFilter {
  Type: string
  Usage: string
  LowPassFrequency: number
  LowPassDamping: number
  HighPassFrequency: number
  HighPassDamping: number
}

export interface SdFeedForward {
  FeedforwardType: string
  KpAccFFT: number
  KpAccFFT_area: number
  FrictionCompensation: number
  FrictionCompensation_area: number
  KpVeloFFT: number
  OpenLoopMoveCurrent: number
  PhaseAdvanceAngle: number
  PhaseAdvanceSpeed: number
  CommutationFilter: number
  AreaCurrentLimit: number
  CurrentChangeLimit: number
  DetectionCurrentRamp: number
  DetectionMaxCurrent: number
  DetectionMinMovement: number
  DetectionFilter: number
}

export interface SoftDriveParameters {
  softDrive: SdSoftDrive
  interpolator: SdInterpolator
  encoder: SdEncoder
  positionControl: SdPositionControl
  velocityControl: SdVelocityControl
  filter: SdFilter
  feedForward: SdFeedForward
}

// ============================================================
// MoverController Parameter Types (Target)
// ============================================================

export interface McGeneral {
  OperationMode: string
  EmergencyRamp: number
  EmergencyTimeOut: number
  StandstillSwitchTime: number
  StandstillSwitchMode: string
  InterpolatorType: string
  CurrentChangeLimit: number
  PhaseAdvance: number
}

export interface McEncoder {
  VelocityFeedbackMode: string
  PositionFeedbackMode: string
  PositionLowPassFilter: number
  VelocityFilterBandwidth: number
  ObserverCorrectionFactor: number
  CommutationErrorVelocity: number
}

export interface McPositionControl {
  PositionLoopType: string
  Kp: number
  Kp_standstill: number
  PositionLoopFilter: number
  InpositionTn: number
}

export interface McVelocityControl {
  VelocityLoopType: string
  Kp: number
  Kp_standstill: number
  Tn: number
  Tn_standstill: number
  Kd: number
  Kd_standstill: number
  ResetIPartAtMotionStart: string
  ResetIPartWithBipolarForceLimitChange: string
  ResetIPartWithFollErrorSignChangeAndBipolarForceLimit: string
  MaxVelocity: number
}

export interface McFilter {
  Type: string
  LowPassFrequency: number
  LowPassDamping: number
  HighPassFrequency: number
  HighPassDamping: number
}

export interface McFeedForward {
  Type: string
  KpAccFFT: number
  FrictionCompensation: number
  DetectionMinMovement: number
  DetectionFilter: number
  DetectionForceRamp: number
  DetectionMaxForceLimitFactor: number
}

export interface MoverControllerParameters {
  general: McGeneral
  encoder: McEncoder
  positionControl: McPositionControl
  velocityControl: McVelocityControl
  filter: McFilter
  feedForward: McFeedForward
}

// ============================================================
// Parameter metadata for UI display
// ============================================================

export interface ParameterDependency {
  /** Key of the parameter in the same module that controls visibility */
  paramKey: string
  /** Parameter is visible only when the controlling param has one of these values */
  values: string[]
}

export interface ParameterMeta {
  name: string
  displayName: string
  unit: string
  type: 'number' | 'enum'
  enumOptions?: string[]
  converted?: boolean
  renamedFrom?: string
  /** Subgroup within the module (e.g. "General", "Optimization", "Advanced") */
  group?: string
  /** Tooltip comment from TMC file */
  comment?: string
  /** Conditional visibility dependency */
  dependsOn?: ParameterDependency
}

/*
 * The parameter tables that used to live here are now generated from the vendor TMC
 * files into `src/data/tmc/<version>/dataset.json` and reached through
 * `@/lib/tmc/registry`. They were transcribed by hand and only ever described one
 * driver version; see scripts/lib/overlay.mjs for the curation that survived.
 */
