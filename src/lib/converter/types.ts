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

export const SD_PARAMETER_META: Record<string, Record<string, ParameterMeta>> = {
  softDrive: {
    OperationMode: { name: 'OperationMode', displayName: 'Operation Mode', unit: '', type: 'number', group: 'General', comment: 'Operation mode of SoftDrive and hardware (8..11).' },
    EmergencyRamp: { name: 'EmergencyRamp', displayName: 'Emergency Ramp', unit: 'mm/s²', type: 'number', group: 'General', comment: 'Emergency deceleration ramp used e.g. in case of an error.' },
    EmergencyTimeOut: { name: 'EmergencyTimeOut', displayName: 'Emergency Time Out', unit: 's', type: 'number', group: 'General', comment: 'Time out for the emergency deceleration ramp.' },
    StandstillSwitchTime: { name: 'StandstillSwitchTime', displayName: 'Standstill Switch Time', unit: 's', type: 'number', group: 'General', comment: 'Time to blend normal parameter into standstill parameter.' },
    StandstillSwitchMode: { name: 'StandstillSwitchMode', displayName: 'Standstill Switch Mode', unit: '', type: 'enum', enumOptions: ['BLENDING_AFTER_SWITCHTIME', 'BLENDING_BEFORE_SWITCHTIME', 'DIRECT_AT_SWITCHTIME'], group: 'General', comment: 'Mode for blending normal standard parameter into standstill parameter.' },
    TorqueConstant: { name: 'SoftDriveMotorPara.TorqueConstant', displayName: 'Motor Torque Constant', unit: 'N/A', type: 'number', group: 'Advanced', comment: 'Force constant of the motor. Used to suggest the magnet plate set; not transferred to the MoverController.' },
  },
  interpolator: {
    InterpolatorType: { name: 'InterpolatorType', displayName: 'Interpolator Type', unit: '', type: 'enum', enumOptions: ['INTERPOLATION_OFF', 'INTERPOLATION_LINEAR', 'INTERPOLATION_POLYNOM3'], group: 'General', comment: 'Set the type of the interpolator calculation.' },
  },
  encoder: {
    VelocityFeedbackMode: { name: 'VelocityFeedbackMode', displayName: 'Velocity Feedback Mode', unit: '', type: 'enum', enumOptions: ['VELOCITY_CALC_BASIC', 'TACHOFILTER', 'OBSERVER', 'OBSERVER2'], group: 'General', comment: 'Define the mode of the actual velocity calculation.' },
    PositionFeedbackMode: { name: 'PositionFeedbackMode', displayName: 'Position Feedback Mode', unit: '', type: 'enum', enumOptions: ['STANDARD', 'MODULO', 'MODULO_START', 'SIMULATION', 'MODULO_START_INVERT'], group: 'General', comment: 'Define the mode of the actual position calculation.' },
    PositionLowPassFilter: { name: 'PositionLowPassFilter', displayName: 'Position Low Pass Filter', unit: 'Hz', type: 'number', group: 'General', comment: 'First order filter at position calculation from encoder.' },
    VelocityFilterBandwidth: { name: 'VelocityFilterBandwidth', displayName: 'Velocity Filter Bandwidth', unit: 'Hz', type: 'number', group: 'General', comment: 'Bandwidth of the observer model or tacho filter.' },
    CorrectionFactor: { name: 'CorrectionFactor', displayName: 'Observer Correction Factor', unit: '', type: 'number', group: 'Advanced', comment: 'Load correction factor of the observer model.' },
    SimulationOffset: { name: 'SimulationOffset', displayName: 'Simulation Offset', unit: 'mm', type: 'number', group: 'Advanced', comment: 'Start position of simulation operation mode.' },
    CommutationErrorVelocity: { name: 'CommutationErrorVelocity', displayName: 'Commutation Error Velocity', unit: 'mm/s', type: 'number', group: 'Advanced', comment: 'Commutation error velocity threshold value.' },
  },
  positionControl: {
    PositionLoopType: { name: 'PositionLoopType', displayName: 'Position Loop Type', unit: '', type: 'enum', enumOptions: ['OFF', 'P_POSITION', 'P_POSITION_STANDSTILL', 'P_POSITION_STANDSTILL_AREA', 'P_POSITION_PRECISE_STANDSTILL'], group: 'General', comment: 'Define the type of the position control.' },
    Kp: { name: 'Kp', displayName: 'Kp', unit: '1/s', type: 'number', group: 'General', comment: 'Proportional gain of position control.', dependsOn: { paramKey: 'PositionLoopType', values: ['P_POSITION', 'P_POSITION_STANDSTILL', 'P_POSITION_STANDSTILL_AREA', 'P_POSITION_PRECISE_STANDSTILL'] } },
    Kp_standstill: { name: 'Kp_standstill', displayName: 'Kp Standstill', unit: '1/s', type: 'number', group: 'General', comment: 'Proportional gain at standstill of position control.', dependsOn: { paramKey: 'PositionLoopType', values: ['P_POSITION_STANDSTILL', 'P_POSITION_STANDSTILL_AREA', 'P_POSITION_PRECISE_STANDSTILL'] } },
    Kp_area: { name: 'Kp_area', displayName: 'Kp Area', unit: '1/s', type: 'number', group: 'General', comment: 'Proportional gain in set area of position control.', dependsOn: { paramKey: 'PositionLoopType', values: ['P_POSITION_STANDSTILL_AREA'] } },
    Kp_area_standstill: { name: 'Kp_area_standstill', displayName: 'Kp Area Standstill', unit: '1/s', type: 'number', group: 'General', comment: 'Proportional gain in set area and standstill of position control.', dependsOn: { paramKey: 'PositionLoopType', values: ['P_POSITION_STANDSTILL_AREA'] } },
    Kp_ffv: { name: 'Kp_ffv', displayName: 'Velocity Feed Forward Gain', unit: '%', type: 'number', group: 'Advanced', comment: 'Proportional gain velocity feed forward. 1.0 is equal to 100 percent.' },
    PosLoopFilter: { name: 'PosLoopFilter', displayName: 'Position Loop Filter', unit: 'Hz', type: 'number', group: 'Advanced', comment: 'First order filter at position loop input.' },
    PosLoopFilter_area: { name: 'PosLoopFilter_area', displayName: 'Position Loop Filter Area', unit: 'Hz', type: 'number', group: 'Advanced', comment: 'First order filter at position loop input in set area.' },
    InpositionTn: { name: 'InpositionTn', displayName: 'In-Position Tn', unit: 's', type: 'number', group: 'Advanced', comment: 'Small inposition integral time constant of position control for faster settling into standstill setpoint position.' },
  },
  velocityControl: {
    VelocityLoopType: { name: 'VelocityLoopType', displayName: 'Velocity Loop Type', unit: '', type: 'enum', enumOptions: ['OFF', 'PI_VELOCITY', 'PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA'], group: 'General', comment: 'Define the type of the velocity control.' },
    Kp: { name: 'Kp', displayName: 'Kp', unit: 'As/rad', type: 'number', group: 'General', comment: 'Proportional gain of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY', 'PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA'] } },
    Kp_standstill: { name: 'Kp_standstill', displayName: 'Kp Standstill', unit: 'As/rad', type: 'number', group: 'General', comment: 'Proportional gain at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA'] } },
    Kp_area: { name: 'Kp_area', displayName: 'Kp Area', unit: 'As/rad', type: 'number', group: 'General', comment: 'Proportional gain in set area of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL_AREA'] } },
    Kp_area_standstill: { name: 'Kp_area_standstill', displayName: 'Kp Area Standstill', unit: 'As/rad', type: 'number', group: 'General', comment: 'Proportional gain in set area and at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL_AREA'] } },
    Tn: { name: 'Tn', displayName: 'Tn', unit: 's', type: 'number', group: 'General', comment: 'Integral time constant of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY', 'PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA'] } },
    Tn_standstill: { name: 'Tn_standstill', displayName: 'Tn Standstill', unit: 's', type: 'number', group: 'General', comment: 'Integral time constant at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA'] } },
    Tn_area: { name: 'Tn_area', displayName: 'Tn Area', unit: 's', type: 'number', group: 'General', comment: 'Integral time constant in set area of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL_AREA'] } },
    Tn_area_standstill: { name: 'Tn_area_standstill', displayName: 'Tn Area Standstill', unit: 's', type: 'number', group: 'General', comment: 'Integral time constant in set area and at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL_AREA'] } },
    Kd: { name: 'Kd', displayName: 'Kd', unit: 'As\u00B2/m', type: 'number', group: 'General', comment: 'Differential gain of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY', 'PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA'] } },
    Kd_standstill: { name: 'Kd_standstill', displayName: 'Kd Standstill', unit: 'As\u00B2/m', type: 'number', group: 'General', comment: 'Differential gain at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA'] } },
    Kd_area: { name: 'Kd_area', displayName: 'Kd Area', unit: 'As\u00B2/m', type: 'number', group: 'General', comment: 'Differential gain in set area of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL_AREA'] } },
    Kd_area_standstill: { name: 'Kd_area_standstill', displayName: 'Kd Area Standstill', unit: 'As\u00B2/m', type: 'number', group: 'General', comment: 'Differential gain in set area and at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL_AREA'] } },
    MaxVelocity: { name: 'MaxVelocity', displayName: 'Max Velocity', unit: 'mm/s', type: 'number', group: 'Advanced', comment: 'Maximum velocity as input for the velocity control used as limiter.' },
    ResetIPartAtMotionStart: { name: 'ResetIPartAtMotionStart', displayName: 'Reset I-Part At Motion Start', unit: '', type: 'enum', enumOptions: ['OFF', 'ON'], group: 'Advanced', comment: 'Reset the integral part of the velocity control at motion start.' },
    ResetIPartWithBipolarCurrentLimitChange: { name: 'ResetIPartWithBipolarCurrentLimitChange', displayName: 'Reset I-Part With Bipolar Current Limit Change', unit: '', type: 'enum', enumOptions: ['OFF', 'ON'], group: 'Advanced', comment: 'Reset the integral part when the bipolar current limit changes.' },
    ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit: { name: 'ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit', displayName: 'Reset I-Part With Foll. Error Sign Change', unit: '', type: 'enum', enumOptions: ['OFF', 'ON'], group: 'Advanced', comment: 'Reset the integral part on following error sign change with bipolar current limit.' },
  },
  filter: {
    Type: { name: 'Type', displayName: 'Filter Type', unit: '', type: 'enum', enumOptions: ['FILTER_OFF', 'LOWPASS1', 'HIGHPASS1', 'PIDT1', 'LOWPASS2', 'HIGHPASS2', 'BIQUAD', 'NOTCH'], group: 'General', comment: 'Type of the filter.' },
    Usage: { name: 'Usage', displayName: 'Usage', unit: '', type: 'enum', enumOptions: ['ALWAYS', 'OUTSIDE_AREA', 'INSIDE_AREA'], group: 'General' },
    LowPassFrequency: { name: 'LowPassFrequency', displayName: 'Low Pass Frequency', unit: 'Hz', type: 'number', group: 'General', comment: 'Set the low pass frequency.', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'PIDT1', 'LOWPASS1', 'LOWPASS2', 'BIQUAD'] } },
    LowPassDamping: { name: 'LowPassDamping', displayName: 'Low Pass Damping', unit: '', type: 'number', group: 'General', comment: 'Set the low pass damping (for second order filter).', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'LOWPASS2', 'BIQUAD'] } },
    HighPassFrequency: { name: 'HighPassFrequency', displayName: 'High Pass Frequency', unit: 'Hz', type: 'number', group: 'General', comment: 'Set the high pass frequency.', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'PIDT1', 'HIGHPASS1', 'HIGHPASS2', 'BIQUAD'] } },
    HighPassDamping: { name: 'HighPassDamping', displayName: 'High Pass Damping', unit: '', type: 'number', group: 'General', comment: 'Set the high pass damping (for second order filter).', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'HIGHPASS2', 'BIQUAD'] } },
  },
  feedForward: {
    FeedforwardType: { name: 'FeedforwardType', displayName: 'Feed Forward Type', unit: '', type: 'enum', enumOptions: ['FFT_OFF', 'FFT_ON', 'MOVE_OPENLOOP', 'FFT_ON_AREA'], group: 'General', comment: 'Define the type of the feed forward control.' },
    KpAccFFT: { name: 'KpAccFFT', displayName: 'KpAccFFT', unit: 'As\u00B2/mm', type: 'number', group: 'General', comment: 'Acceleration feed forward gain.', dependsOn: { paramKey: 'FeedforwardType', values: ['FFT_ON', 'FFT_ON_AREA'] } },
    KpAccFFT_area: { name: 'KpAccFFT_area', displayName: 'KpAccFFT Area', unit: 'As\u00B2/mm', type: 'number', group: 'General', comment: 'Acceleration feed forward gain in set area.', dependsOn: { paramKey: 'FeedforwardType', values: ['FFT_ON_AREA'] } },
    FrictionCompensation: { name: 'FrictionCompensation', displayName: 'Friction Compensation', unit: 'A', type: 'number', group: 'General', comment: 'Feed forward current to compensate static friction.', dependsOn: { paramKey: 'FeedforwardType', values: ['FFT_ON', 'FFT_ON_AREA'] } },
    FrictionCompensation_area: { name: 'FrictionCompensation_area', displayName: 'Friction Compensation Area', unit: 'A', type: 'number', group: 'General', comment: 'Feed forward current to compensate static friction in set area.', dependsOn: { paramKey: 'FeedforwardType', values: ['FFT_ON_AREA'] } },
    KpVeloFFT: { name: 'KpVeloFFT', displayName: 'KpVeloFFT', unit: '', type: 'number', group: 'General', dependsOn: { paramKey: 'FeedforwardType', values: ['FFT_ON', 'FFT_ON_AREA'] } },
    OpenLoopMoveCurrent: { name: 'OpenLoopMoveCurrent', displayName: 'Open Loop Move Current', unit: 'A', type: 'number', group: 'Advanced', comment: 'Set the open loop move current with the position command as commutation angle.', dependsOn: { paramKey: 'FeedforwardType', values: ['MOVE_OPENLOOP'] } },
    PhaseAdvanceAngle: { name: 'PhaseAdvanceAngle', displayName: 'Phase Advance Angle', unit: 'elec.degree', type: 'number', group: 'Advanced', comment: 'Set the commutation angle offset at phase advance speed.' },
    PhaseAdvanceSpeed: { name: 'PhaseAdvanceSpeed', displayName: 'Phase Advance Speed', unit: 'mm/s', type: 'number', group: 'Advanced', comment: 'Set the phase advance speed.' },
    CommutationFilter: { name: 'CommutationFilter', displayName: 'Commutation Filter', unit: '', type: 'number', group: 'Advanced' },
    AreaCurrentLimit: { name: 'AreaCurrentLimit', displayName: 'Area Current Limit', unit: 'A', type: 'number', group: 'General', comment: 'Current limit in specific area (0=not used). Area control needs to be set.', dependsOn: { paramKey: 'FeedforwardType', values: ['FFT_ON_AREA'] } },
    CurrentChangeLimit: { name: 'CurrentChangeLimit', displayName: 'Current Change Limit', unit: 'A/Cycle', type: 'number', group: 'Advanced', comment: 'di/dt limit per cycle in position mode.' },
    DetectionCurrentRamp: { name: 'DetectionCurrentRamp', displayName: 'Detection Current Ramp', unit: 'mA/ms', type: 'number', group: 'Mover ID Detection', comment: 'Current ramp to increase the used current for the mover 1 detection.' },
    DetectionMaxCurrent: { name: 'DetectionMaxCurrent', displayName: 'Detection Max Current', unit: 'A', type: 'number', group: 'Mover ID Detection', comment: 'Maximum current for the mover 1 detection.' },
    DetectionMinMovement: { name: 'DetectionMinMovement', displayName: 'Detection Min Movement', unit: 'mm', type: 'number', group: 'Mover ID Detection', comment: 'Min movement for the mover 1 detection phases.' },
    DetectionFilter: { name: 'DetectionFilter', displayName: 'Detection Filter', unit: 'Hz', type: 'number', group: 'Mover ID Detection', comment: 'Low pass filter for the current ramp of mover 1 detection (0 = off).' },
  },
}

export const MC_PARAMETER_META: Record<string, Record<string, ParameterMeta>> = {
  general: {
    OperationMode: { name: 'OperationMode', displayName: 'Operation Mode', unit: '', type: 'enum', converted: true, group: 'General', comment: 'Operation mode of controller and hardware. Translated from the numeric SoftDrive value.' },
    EmergencyRamp: { name: 'EmergencyRamp', displayName: 'Emergency Ramp', unit: 'mm/s²', type: 'number', group: 'General', comment: 'Emergency deceleration ramp used e.g. in case of an error.' },
    EmergencyTimeOut: { name: 'EmergencyTimeOut', displayName: 'Emergency Time Out', unit: 's', type: 'number', group: 'General', comment: 'Time out for the emergency deceleration ramp.' },
    StandstillSwitchTime: { name: 'StandstillSwitchTime', displayName: 'Standstill Switch Time', unit: 's', type: 'number', group: 'General', comment: 'Time to blend normal parameter into standstill parameter.' },
    StandstillSwitchMode: { name: 'StandstillSwitchMode', displayName: 'Standstill Switch Mode', unit: '', type: 'enum', group: 'General', comment: 'Mode for blending normal standard parameter into standstill parameter.' },
    InterpolatorType: { name: 'InterpolatorType', displayName: 'Interpolator Type', unit: '', type: 'enum', group: 'Interpolator', comment: 'Set the type of the interpolator calculation.' },
    CurrentChangeLimit: { name: 'CurrentChangeLimit', displayName: 'Current Change Limit', unit: 'A/Cycle', type: 'number', group: 'Advanced', comment: 'di/dt limit per cycle in position mode.' },
    PhaseAdvance: { name: 'PhaseAdvance', displayName: 'Phase Advance', unit: 'Cycles', type: 'number', converted: true, renamedFrom: 'PhaseAdvanceAngle', group: 'Advanced', comment: 'Number of cycles for the phase advance.' },
  },
  encoder: {
    VelocityFeedbackMode: { name: 'VelocityFeedbackMode', displayName: 'Velocity Feedback Mode', unit: '', type: 'enum', group: 'General', comment: 'Define the mode of the actual velocity calculation.' },
    PositionFeedbackMode: { name: 'PositionFeedbackMode', displayName: 'Position Feedback Mode', unit: '', type: 'enum', group: 'General', comment: 'Define the mode of the actual position calculation.' },
    PositionLowPassFilter: { name: 'PositionLowPassFilter', displayName: 'Position Low Pass Filter', unit: 'Hz', type: 'number', group: 'General', comment: 'First order filter at position calculation from encoder.' },
    VelocityFilterBandwidth: { name: 'VelocityFilterBandwidth', displayName: 'Velocity Filter Bandwidth', unit: 'Hz', type: 'number', group: 'General', comment: 'Bandwidth of the observer model or tacho filter.' },
    ObserverCorrectionFactor: { name: 'ObserverCorrectionFactor', displayName: 'Observer Correction Factor', unit: '', type: 'number', converted: true, renamedFrom: 'CorrectionFactor', group: 'Advanced', comment: 'Load correction factor of the observer model.' },
    CommutationErrorVelocity: { name: 'CommutationErrorVelocity', displayName: 'Commutation Error Velocity', unit: 'mm/s', type: 'number', group: 'Advanced', comment: 'Commutation error velocity threshold value.' },
  },
  positionControl: {
    PositionLoopType: { name: 'PositionLoopType', displayName: 'Position Loop Type', unit: '', type: 'enum', group: 'General', comment: 'Define the type of the position control.' },
    Kp: { name: 'Kp', displayName: 'Kp', unit: '1/s', type: 'number', group: 'General', comment: 'Proportional gain of position control.', dependsOn: { paramKey: 'PositionLoopType', values: ['P_POSITION', 'P_POSITION_STANDSTILL', 'P_POSITION_STANDSTILL_AREA', 'P_POSITION_PRECISE_STANDSTILL'] } },
    Kp_standstill: { name: 'Kp_standstill', displayName: 'Kp Standstill', unit: '1/s', type: 'number', group: 'General', comment: 'Proportional gain at standstill of position control.', dependsOn: { paramKey: 'PositionLoopType', values: ['P_POSITION_STANDSTILL', 'P_POSITION_STANDSTILL_AREA', 'P_POSITION_PRECISE_STANDSTILL'] } },
    PositionLoopFilter: { name: 'PositionLoopFilter', displayName: 'Position Loop Filter', unit: 'Hz', type: 'number', renamedFrom: 'PosLoopFilter', group: 'Advanced', comment: 'First order filter at position loop input.' },
    InpositionTn: { name: 'InpositionTn', displayName: 'In-Position Tn', unit: 's', type: 'number', group: 'Advanced', comment: 'Small inposition integral time constant of position control for faster settling into standstill setpoint position.' },
  },
  velocityControl: {
    VelocityLoopType: { name: 'VelocityLoopType', displayName: 'Velocity Loop Type', unit: '', type: 'enum', group: 'General', comment: 'Define the type of the velocity control.' },
    Kp: { name: 'Kp', displayName: 'Kp', unit: 'Ns/m', type: 'number', converted: true, group: 'General', comment: 'Proportional gain of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY', 'PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA', 'PID_VELOCITY', 'PID_VELOCITY_STANDSTILL'] } },
    Kp_standstill: { name: 'Kp_standstill', displayName: 'Kp Standstill', unit: 'Ns/m', type: 'number', converted: true, group: 'General', comment: 'Proportional gain at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA', 'PID_VELOCITY_STANDSTILL'] } },
    Tn: { name: 'Tn', displayName: 'Tn', unit: 's', type: 'number', group: 'General', comment: 'Integral time constant of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY', 'PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA', 'PID_VELOCITY', 'PID_VELOCITY_STANDSTILL'] } },
    Tn_standstill: { name: 'Tn_standstill', displayName: 'Tn Standstill', unit: 's', type: 'number', group: 'General', comment: 'Integral time constant at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA', 'PID_VELOCITY_STANDSTILL'] } },
    Kd: { name: 'Kd', displayName: 'Kd', unit: 'Ns\u00B2/m', type: 'number', converted: true, group: 'General', comment: 'Differential gain of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY', 'PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA', 'PID_VELOCITY', 'PID_VELOCITY_STANDSTILL'] } },
    Kd_standstill: { name: 'Kd_standstill', displayName: 'Kd Standstill', unit: 'Ns\u00B2/m', type: 'number', converted: true, group: 'General', comment: 'Differential gain at standstill of velocity control.', dependsOn: { paramKey: 'VelocityLoopType', values: ['PI_VELOCITY_STANDSTILL', 'PI_VELOCITY_STANDSTILL_AREA', 'PID_VELOCITY_STANDSTILL'] } },
    ResetIPartAtMotionStart: { name: 'ResetIPartAtMotionStart', displayName: 'Reset I-Part At Motion Start', unit: '', type: 'enum', converted: true, group: 'Advanced', comment: 'Reset the integral part of the velocity control at motion start.' },
    ResetIPartWithBipolarForceLimitChange: { name: 'ResetIPartWithBipolarForceLimitChange', displayName: 'Reset I-Part With Bipolar Force Limit Change', unit: '', type: 'enum', converted: true, renamedFrom: 'ResetIPartWithBipolarCurrentLimitChange', group: 'Advanced', comment: 'Reset the integral part when the bipolar force limit changes.' },
    ResetIPartWithFollErrorSignChangeAndBipolarForceLimit: { name: 'ResetIPartWithFollErrorSignChangeAndBipolarForceLimit', displayName: 'Reset I-Part With Foll. Error Sign Change', unit: '', type: 'enum', converted: true, renamedFrom: 'ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit', group: 'Advanced', comment: 'Reset the integral part on following error sign change with bipolar force limit.' },
    MaxVelocity: { name: 'MaxVelocity', displayName: 'Max Velocity', unit: 'mm/s', type: 'number', group: 'Advanced', comment: 'Maximum velocity as input for the velocity control used as limiter.' },
  },
  filter: {
    Type: { name: 'Type', displayName: 'Filter Type', unit: '', type: 'enum', group: 'General', comment: 'Type of the filter.' },
    LowPassFrequency: { name: 'LowPassFrequency', displayName: 'Low Pass Frequency', unit: 'Hz', type: 'number', group: 'General', comment: 'Set the low pass frequency.', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'PIDT1', 'LOWPASS1', 'LOWPASS2'] } },
    LowPassDamping: { name: 'LowPassDamping', displayName: 'Low Pass Damping', unit: '', type: 'number', group: 'General', comment: 'Set the low pass damping (for second order filter).', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'LOWPASS2'] } },
    HighPassFrequency: { name: 'HighPassFrequency', displayName: 'High Pass Frequency', unit: 'Hz', type: 'number', group: 'General', comment: 'Set the high pass frequency.', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'PIDT1', 'HIGHPASS1', 'HIGHPASS2'] } },
    HighPassDamping: { name: 'HighPassDamping', displayName: 'High Pass Damping', unit: '', type: 'number', group: 'General', comment: 'Set the high pass damping (for second order filter).', dependsOn: { paramKey: 'Type', values: ['NOTCH', 'HIGHPASS2'] } },
  },
  feedForward: {
    Type: { name: 'Type', displayName: 'Feed Forward Type', unit: '', type: 'enum', renamedFrom: 'FeedforwardType', group: 'General', comment: 'Define the type of the feed forward control.' },
    KpAccFFT: { name: 'KpAccFFT', displayName: 'KpAccFFT', unit: 'Ns\u00B2/m', type: 'number', converted: true, group: 'General', comment: 'Acceleration feed forward gain.', dependsOn: { paramKey: 'Type', values: ['FFT_ON', 'FFT_ON_AREA'] } },
    FrictionCompensation: { name: 'FrictionCompensation', displayName: 'Friction Compensation', unit: 'N', type: 'number', converted: true, group: 'General', comment: 'Feed forward force to compensate static friction.', dependsOn: { paramKey: 'Type', values: ['FFT_ON', 'FFT_ON_AREA'] } },
    DetectionMinMovement: { name: 'DetectionMinMovement', displayName: 'Detection Min Movement', unit: 'mm', type: 'number', group: 'Mover Id Detection', comment: 'Min movement for the mover 1 detection phases.' },
    DetectionFilter: { name: 'DetectionFilter', displayName: 'Detection Filter', unit: 'Hz', type: 'number', group: 'Mover Id Detection', comment: 'Low pass filter for the force ramp of mover 1 detection (0 = off).' },
    DetectionForceRamp: { name: 'DetectionForceRamp', displayName: 'Detection Force Ramp', unit: 'N/s', type: 'number', converted: true, renamedFrom: 'DetectionCurrentRamp', group: 'Mover Id Detection', comment: 'Force ramp to increase the used force for the mover 1 detection.' },
    DetectionMaxForceLimitFactor: { name: 'DetectionMaxForceLimitFactor', displayName: 'Detection Max Force Limit Factor', unit: '', type: 'number', converted: true, renamedFrom: 'DetectionMaxCurrent', group: 'Mover Id Detection', comment: 'Reduce max force by factor for the mover 1 detection.' },
  },
}
