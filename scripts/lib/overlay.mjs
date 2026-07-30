/**
 * Curated metadata that the TMC cannot supply.
 *
 * The TMC describes the driver; this file describes how this application presents it.
 * The two are merged by `buildMeta()` in ./meta.mjs, with the TMC supplying unit,
 * comment, enum members, grouping and numeric-ness, and this file supplying everything
 * that is a product decision:
 *
 * - **The allowlist.** Only parameters named here are shown. A new driver version can
 *   add parameters without them appearing unreviewed in the UI; the generator reports
 *   them as a warning instead.
 * - **Display order.** The key order of each `parameters` object is the order the UI
 *   renders, which is not the order the TMC declares.
 * - **`displayName`** — there is no reliable way to derive "In-Position Tn" from
 *   `InpositionTn`, so every name is stated.
 * - **`converted` / `renamedFrom`** — facts about the SoftDrive → MoverController
 *   conversion, which live in converter.ts and are not driver properties at all.
 * - **`dependsOn`** — which parameters are relevant for which value of another.
 * - **Overrides** of `comment`, `unit`, `group`, `enumOptions` and `name`,
 *   used sparingly and only where the vendor text is wrong, unpunctuated or unclear.
 *
 * This file is plain ESM rather than TypeScript because the generator that reads it is
 * plain ESM. `buildMeta()` validates every key against the TMC, so a mistyped
 * parameter name fails the build rather than silently disappearing from the UI.
 */

/** MoverController modules, in the order a parameter set lists them. */
export const MC_OVERLAY = {
  modules: [
  {
    key: "general",
    label: "General",
    tmcModuleGuid: "98BEC76D-D436-4208-9F8B-486BE57865BD",
    parameters: {
      "OperationMode": { displayName: "Operation Mode", converted: true, comment: "Operation mode of controller and hardware. Translated from the numeric SoftDrive value." },
      "EmergencyRamp": { displayName: "Emergency Ramp" },
      "EmergencyTimeOut": { displayName: "Emergency Time Out", comment: "Time out for the emergency deceleration ramp." },
      "StandstillSwitchTime": { displayName: "Standstill Switch Time", comment: "Time to blend normal parameter into standstill parameter." },
      "StandstillSwitchMode": { displayName: "Standstill Switch Mode", enumOptions: ["BLENDING_AFTER_SWITCHTIME","BLENDING_BEFORE_SWITCHTIME","DIRECT_AT_SWITCHTIME"] },
      "InterpolatorType": { displayName: "Interpolator Type" },
      "CurrentChangeLimit": { displayName: "Current Change Limit" },
      "PhaseAdvance": { displayName: "Phase Advance", converted: true, renamedFrom: "PhaseAdvanceAngle" },
    },
  },
  {
    key: "encoder",
    label: "Encoder",
    tmcModuleGuid: "2A657C12-787C-40C0-8E6C-D68FB6D58760",
    parameters: {
      "VelocityFeedbackMode": { displayName: "Velocity Feedback Mode" },
      "PositionFeedbackMode": { displayName: "Position Feedback Mode" },
      "PositionLowPassFilter": { displayName: "Position Low Pass Filter" },
      "VelocityFilterBandwidth": { displayName: "Velocity Filter Bandwidth", comment: "Bandwidth of the observer model or tacho filter." },
      "ObserverCorrectionFactor": { displayName: "Observer Correction Factor", converted: true, renamedFrom: "CorrectionFactor" },
      "CommutationErrorVelocity": { displayName: "Commutation Error Velocity" },
    },
  },
  {
    key: "positionControl",
    label: "Position Control",
    tmcModuleGuid: "57584E44-D085-4D23-86E4-3BE2859F4EC5",
    parameters: {
      "PositionLoopType": { displayName: "Position Loop Type" },
      "Kp": { displayName: "Kp", dependsOn: {"paramKey":"PositionLoopType","values":["P_POSITION","P_POSITION_STANDSTILL","P_POSITION_PRECISE_STANDSTILL"]} },
      "Kp_standstill": { displayName: "Kp Standstill", dependsOn: {"paramKey":"PositionLoopType","values":["P_POSITION_STANDSTILL","P_POSITION_PRECISE_STANDSTILL"]} },
      "PositionLoopFilter": { displayName: "Position Loop Filter", renamedFrom: "PosLoopFilter" },
      "InpositionTn": { displayName: "In-Position Tn" },
    },
  },
  {
    key: "velocityControl",
    label: "Velocity Control",
    tmcModuleGuid: "E9D8B517-6857-41D8-A4A3-60C89603D74A",
    parameters: {
      "VelocityLoopType": { displayName: "Velocity Loop Type", converted: true },
      "Kp": { displayName: "Kp", converted: true, dependsOn: {"paramKey":"VelocityLoopType","values":["PID_VELOCITY","PID_VELOCITY_STANDSTILL"]} },
      "Kp_standstill": { displayName: "Kp Standstill", converted: true, dependsOn: {"paramKey":"VelocityLoopType","values":["PID_VELOCITY_STANDSTILL"]} },
      "Tn": { displayName: "Tn", dependsOn: {"paramKey":"VelocityLoopType","values":["PID_VELOCITY","PID_VELOCITY_STANDSTILL"]} },
      "Tn_standstill": { displayName: "Tn Standstill", dependsOn: {"paramKey":"VelocityLoopType","values":["PID_VELOCITY_STANDSTILL"]} },
      "Kd": { displayName: "Kd", converted: true, dependsOn: {"paramKey":"VelocityLoopType","values":["PID_VELOCITY","PID_VELOCITY_STANDSTILL"]} },
      "Kd_standstill": { displayName: "Kd Standstill", converted: true, dependsOn: {"paramKey":"VelocityLoopType","values":["PID_VELOCITY_STANDSTILL"]} },
      "ResetIPartAtMotionStart": { displayName: "Reset I-Part At Motion Start", converted: true, group: "Advanced", comment: "Reset the integral part of the velocity control at motion start." },
      "ResetIPartWithBipolarForceLimitChange": { displayName: "Reset I-Part With Bipolar Force Limit Change", converted: true, renamedFrom: "ResetIPartWithBipolarCurrentLimitChange", group: "Advanced", comment: "Reset the integral part when the bipolar force limit changes." },
      "ResetIPartWithFollErrorSignChangeAndBipolarForceLimit": { displayName: "Reset I-Part With Foll. Error Sign Change", converted: true, renamedFrom: "ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit", group: "Advanced", comment: "Reset the integral part on following error sign change with bipolar force limit." },
      "MaxVelocity": { displayName: "Max Velocity" },
    },
  },
  {
    key: "filter",
    label: "Filter",
    tmcModuleGuid: "FAEB97D8-ED6E-4986-8449-630C65D48156",
    parameters: {
      "Type": { displayName: "Filter Type", converted: true, comment: "Type of the filter. The SoftDrive BIQUAD filter is converted to NOTCH." },
      "LowPassFrequency": { displayName: "Low Pass Frequency", dependsOn: {"paramKey":"Type","values":["NOTCH","PIDT1","LOWPASS1","LOWPASS2"]} },
      "LowPassDamping": { displayName: "Low Pass Damping", dependsOn: {"paramKey":"Type","values":["NOTCH","LOWPASS2"]} },
      "HighPassFrequency": { displayName: "High Pass Frequency", dependsOn: {"paramKey":"Type","values":["NOTCH","PIDT1","HIGHPASS1","HIGHPASS2"]} },
      "HighPassDamping": { displayName: "High Pass Damping", dependsOn: {"paramKey":"Type","values":["NOTCH","HIGHPASS2"]} },
    },
  },
  {
    key: "feedForward",
    label: "Feed Forward",
    tmcModuleGuid: "7E8B155E-1E66-48E1-9D28-0607FA48FC11",
    parameters: {
      "Type": { displayName: "Feed Forward Type", renamedFrom: "FeedforwardType" },
      "KpAccFFT": { displayName: "KpAccFFT", converted: true, dependsOn: {"paramKey":"Type","values":["FFT_ON"]} },
      "FrictionCompensation": { displayName: "Friction Compensation", converted: true, dependsOn: {"paramKey":"Type","values":["FFT_ON"]} },
      "DetectionMinMovement": { displayName: "Detection Min Movement" },
      "DetectionFilter": { displayName: "Detection Filter" },
      "DetectionForceRamp": { displayName: "Detection Force Ramp", converted: true, renamedFrom: "DetectionCurrentRamp" },
      "DetectionMaxForceLimitFactor": { displayName: "Detection Max Force Limit Factor", converted: true, renamedFrom: "DetectionMaxCurrent" },
    },
  },
  ],
}

/**
 * SoftDrive modules — the format being migrated away from.
 *
 * `softDrive` holds the parameters stored on the drive object itself. It has no icon
 * of its own, so it borrows the MoverController's General icon, which is why
 * `iconFrom` points at the other TMC.
 */
export const SD_OVERLAY = {
  modules: [
  {
    key: "softDrive",
    label: "SoftDrive",
    tmcModuleGuid: "272A98C0-4C87-4243-BED6-3BB69E29F02C",
    // The drive object has no icon of its own; TwinCAT shows the General icon here.
    icon: { from: "mc", moduleGuid: "98BEC76D-D436-4208-9F8B-486BE57865BD" },
    parameters: {
      "OperationMode": { displayName: "Operation Mode", comment: "Operation mode of SoftDrive and hardware (8..11)." },
      "EmergencyRamp": { displayName: "Emergency Ramp", comment: "Emergency deceleration ramp used e.g. in case of an error." },
      "EmergencyTimeOut": { displayName: "Emergency Time Out", comment: "Time out for the emergency deceleration ramp." },
      "StandstillSwitchTime": { displayName: "Standstill Switch Time", comment: "Time to blend normal parameter into standstill parameter." },
      "StandstillSwitchMode": { displayName: "Standstill Switch Mode", enumOptions: ["BLENDING_AFTER_SWITCHTIME","BLENDING_BEFORE_SWITCHTIME","DIRECT_AT_SWITCHTIME"], comment: "Mode for blending normal standard parameter into standstill parameter." },
      "TorqueConstant": { displayName: "Motor Torque Constant", name: "SoftDriveMotorPara.TorqueConstant", comment: "Force constant of the motor. Used to suggest the magnet plate set; not transferred to the MoverController." },
    },
  },
  {
    key: "interpolator",
    label: "Interpolator",
    tmcModuleGuid: "13ED0DF8-3244-45E9-B3BA-89C339E4DFF3",
    parameters: {
      "InterpolatorType": { displayName: "Interpolator Type", comment: "Set the type of the interpolator calculation." },
    },
  },
  {
    key: "encoder",
    label: "Encoder",
    tmcModuleGuid: "8D695A14-7DB9-4D35-A64A-30D334B5E2D3",
    parameters: {
      "VelocityFeedbackMode": { displayName: "Velocity Feedback Mode", comment: "Define the mode of the actual velocity calculation." },
      "PositionFeedbackMode": { displayName: "Position Feedback Mode", comment: "Define the mode of the actual position calculation." },
      "PositionLowPassFilter": { displayName: "Position Low Pass Filter", comment: "First order filter at position calculation from encoder." },
      "VelocityFilterBandwidth": { displayName: "Velocity Filter Bandwidth", comment: "Bandwidth of the observer model or tacho filter." },
      "CorrectionFactor": { displayName: "Observer Correction Factor", comment: "Load correction factor of the observer model." },
      "SimulationOffset": { displayName: "Simulation Offset", comment: "Start position of simulation operation mode." },
      "CommutationErrorVelocity": { displayName: "Commutation Error Velocity", comment: "Commutation error velocity threshold value." },
    },
  },
  {
    key: "positionControl",
    label: "Position Control",
    tmcModuleGuid: "1A7898EF-F86A-4B73-8DF4-2E8199B711BA",
    parameters: {
      "PositionLoopType": { displayName: "Position Loop Type", comment: "Define the type of the position control." },
      "Kp": { displayName: "Kp", comment: "Proportional gain of position control.", dependsOn: {"paramKey":"PositionLoopType","values":["P_POSITION","P_POSITION_STANDSTILL","P_POSITION_STANDSTILL_AREA","P_POSITION_PRECISE_STANDSTILL"]} },
      "Kp_standstill": { displayName: "Kp Standstill", comment: "Proportional gain at standstill of position control.", dependsOn: {"paramKey":"PositionLoopType","values":["P_POSITION_STANDSTILL","P_POSITION_STANDSTILL_AREA","P_POSITION_PRECISE_STANDSTILL"]} },
      "Kp_area": { displayName: "Kp Area", comment: "Proportional gain in set area of position control.", dependsOn: {"paramKey":"PositionLoopType","values":["P_POSITION_STANDSTILL_AREA"]} },
      "Kp_area_standstill": { displayName: "Kp Area Standstill", comment: "Proportional gain in set area and standstill of position control.", dependsOn: {"paramKey":"PositionLoopType","values":["P_POSITION_STANDSTILL_AREA"]} },
      "Kp_ffv": { displayName: "Velocity Feed Forward Gain", unit: "%", comment: "Proportional gain velocity feed forward. 1.0 is equal to 100 percent." },
      "PosLoopFilter": { displayName: "Position Loop Filter", comment: "First order filter at position loop input." },
      "PosLoopFilter_area": { displayName: "Position Loop Filter Area", comment: "First order filter at position loop input in set area." },
      "InpositionTn": { displayName: "In-Position Tn", comment: "Small inposition integral time constant of position control for faster settling into standstill setpoint position." },
    },
  },
  {
    key: "velocityControl",
    label: "Velocity Control",
    tmcModuleGuid: "CCE414CE-CCCB-4126-B90C-5D2688AF5025",
    parameters: {
      "VelocityLoopType": { displayName: "Velocity Loop Type", comment: "Define the type of the velocity control." },
      "Kp": { displayName: "Kp", comment: "Proportional gain of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY","PI_VELOCITY_STANDSTILL","PI_VELOCITY_STANDSTILL_AREA"]} },
      "Kp_standstill": { displayName: "Kp Standstill", comment: "Proportional gain at standstill of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL","PI_VELOCITY_STANDSTILL_AREA"]} },
      "Kp_area": { displayName: "Kp Area", comment: "Proportional gain in set area of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL_AREA"]} },
      "Kp_area_standstill": { displayName: "Kp Area Standstill", comment: "Proportional gain in set area and at standstill of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL_AREA"]} },
      "Tn": { displayName: "Tn", comment: "Integral time constant of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY","PI_VELOCITY_STANDSTILL","PI_VELOCITY_STANDSTILL_AREA"]} },
      "Tn_standstill": { displayName: "Tn Standstill", comment: "Integral time constant at standstill of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL","PI_VELOCITY_STANDSTILL_AREA"]} },
      "Tn_area": { displayName: "Tn Area", comment: "Integral time constant in set area of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL_AREA"]} },
      "Tn_area_standstill": { displayName: "Tn Area Standstill", comment: "Integral time constant in set area and at standstill of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL_AREA"]} },
      "Kd": { displayName: "Kd", comment: "Differential gain of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY","PI_VELOCITY_STANDSTILL","PI_VELOCITY_STANDSTILL_AREA"]} },
      "Kd_standstill": { displayName: "Kd Standstill", comment: "Differential gain at standstill of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL","PI_VELOCITY_STANDSTILL_AREA"]} },
      "Kd_area": { displayName: "Kd Area", comment: "Differential gain in set area of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL_AREA"]} },
      "Kd_area_standstill": { displayName: "Kd Area Standstill", comment: "Differential gain in set area and at standstill of velocity control.", dependsOn: {"paramKey":"VelocityLoopType","values":["PI_VELOCITY_STANDSTILL_AREA"]} },
      "MaxVelocity": { displayName: "Max Velocity", comment: "Maximum velocity as input for the velocity control used as limiter." },
      "ResetIPartAtMotionStart": { displayName: "Reset I-Part At Motion Start", group: "Advanced", comment: "Reset the integral part of the velocity control at motion start." },
      "ResetIPartWithBipolarCurrentLimitChange": { displayName: "Reset I-Part With Bipolar Current Limit Change", group: "Advanced", comment: "Reset the integral part when the bipolar current limit changes." },
      "ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit": { displayName: "Reset I-Part With Foll. Error Sign Change", group: "Advanced", comment: "Reset the integral part on following error sign change with bipolar current limit." },
    },
  },
  {
    key: "filter",
    label: "Filter",
    tmcModuleGuid: "3B51FB30-AC26-40E9-AFB9-E5ADED4491AC",
    parameters: {
      "Type": { displayName: "Filter Type", comment: "Type of the filter." },
      "Usage": { displayName: "Usage" },
      "LowPassFrequency": { displayName: "Low Pass Frequency", comment: "Set the low pass frequency.", dependsOn: {"paramKey":"Type","values":["NOTCH","PIDT1","LOWPASS1","LOWPASS2","BIQUAD"]} },
      "LowPassDamping": { displayName: "Low Pass Damping", comment: "Set the low pass damping (for second order filter).", dependsOn: {"paramKey":"Type","values":["NOTCH","LOWPASS2","BIQUAD"]} },
      "HighPassFrequency": { displayName: "High Pass Frequency", comment: "Set the high pass frequency.", dependsOn: {"paramKey":"Type","values":["NOTCH","PIDT1","HIGHPASS1","HIGHPASS2","BIQUAD"]} },
      "HighPassDamping": { displayName: "High Pass Damping", comment: "Set the high pass damping (for second order filter).", dependsOn: {"paramKey":"Type","values":["NOTCH","HIGHPASS2","BIQUAD"]} },
    },
  },
  {
    key: "feedForward",
    label: "Feed Forward",
    tmcModuleGuid: "68AA515C-6BA6-4D3E-86A0-1A3EB553CF37",
    parameters: {
      "FeedforwardType": { displayName: "Feed Forward Type", comment: "Define the type of the feed forward control." },
      "KpAccFFT": { displayName: "KpAccFFT", comment: "Acceleration feed forward gain.", dependsOn: {"paramKey":"FeedforwardType","values":["FFT_ON","FFT_ON_AREA"]} },
      "KpAccFFT_area": { displayName: "KpAccFFT Area", comment: "Acceleration feed forward gain in set area.", dependsOn: {"paramKey":"FeedforwardType","values":["FFT_ON_AREA"]} },
      "FrictionCompensation": { displayName: "Friction Compensation", comment: "Feed forward current to compensate static friction.", dependsOn: {"paramKey":"FeedforwardType","values":["FFT_ON","FFT_ON_AREA"]} },
      "FrictionCompensation_area": { displayName: "Friction Compensation Area", comment: "Feed forward current to compensate static friction in set area.", dependsOn: {"paramKey":"FeedforwardType","values":["FFT_ON_AREA"]} },
      "KpVeloFFT": { notInTmc: true, displayName: "KpVeloFFT", unit: "", type: "number", group: "General", dependsOn: {"paramKey":"FeedforwardType","values":["FFT_ON","FFT_ON_AREA"]} },
      "OpenLoopMoveCurrent": { displayName: "Open Loop Move Current", comment: "Set the open loop move current with the position command as commutation angle.", dependsOn: {"paramKey":"FeedforwardType","values":["MOVE_OPENLOOP"]} },
      "PhaseAdvanceAngle": { displayName: "Phase Advance Angle", comment: "Set the commutation angle offset at phase advance speed." },
      "PhaseAdvanceSpeed": { displayName: "Phase Advance Speed", comment: "Set the phase advance speed." },
      "CommutationFilter": { notInTmc: true, displayName: "Commutation Filter", unit: "", type: "number", group: "Advanced" },
      "AreaCurrentLimit": { displayName: "Area Current Limit", comment: "Current limit in specific area (0=not used). Area control needs to be set.", dependsOn: {"paramKey":"FeedforwardType","values":["FFT_ON_AREA"]} },
      "CurrentChangeLimit": { displayName: "Current Change Limit", unit: "A/Cycle", comment: "di/dt limit per cycle in position mode." },
      "DetectionCurrentRamp": { displayName: "Detection Current Ramp", comment: "Current ramp to increase the used current for the mover 1 detection." },
      "DetectionMaxCurrent": { displayName: "Detection Max Current", comment: "Maximum current for the mover 1 detection." },
      "DetectionMinMovement": { displayName: "Detection Min Movement", comment: "Min movement for the mover 1 detection phases." },
      "DetectionFilter": { displayName: "Detection Filter", comment: "Low pass filter for the current ramp of mover 1 detection (0 = off)." },
    },
  },
  ],
}
