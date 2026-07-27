import type { SoftDriveParameters } from '@/lib/converter/types'
import { createDefaultSoftDriveParameters } from '@/lib/converter/defaults'
import { locateSoftDrive, getEnumValue, getNumericValue } from './locate'
import type { SourceFormat } from './locate'
import { parseControlAreas } from './controlAreas'
import type { ControlArea } from './controlAreas'

export interface ParsedSoftDrive {
  params: SoftDriveParameters
  controlAreas: ControlArea[]
  format: SourceFormat
}

export function parseSoftDriveXml(xmlString: string): ParsedSoftDrive {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent}`)
  }

  const located = locateSoftDrive(doc)
  if (!located) {
    throw new Error('No SoftDrive ParameterSet found in XML')
  }

  const defaults = createDefaultSoftDriveParameters()
  const {
    interpolator: interpolatorSet,
    encoder: encoderSet,
    positionControl: posControlSet,
    velocityControl: velControlSet,
    filter: filterSet,
    feedForward: feedForwardSet,
  } = located.modules

  // The SoftDrive object itself carries these above its sub-modules.
  const softDriveRoot = located.root

  const params: SoftDriveParameters = {
    softDrive: {
      OperationMode: getNumericValue(softDriveRoot, 'OperationMode') ?? defaults.softDrive.OperationMode,
      EmergencyRamp: getNumericValue(softDriveRoot, 'EmergencyRamp') ?? defaults.softDrive.EmergencyRamp,
      EmergencyTimeOut: getNumericValue(softDriveRoot, 'EmergencyTimeOut') ?? defaults.softDrive.EmergencyTimeOut,
      StandstillSwitchTime: getNumericValue(softDriveRoot, 'StandstillSwitchTime') ?? defaults.softDrive.StandstillSwitchTime,
      StandstillSwitchMode: getEnumValue(softDriveRoot, 'StandstillSwitchMode') ?? defaults.softDrive.StandstillSwitchMode,
      TorqueConstant: getNumericValue(softDriveRoot, 'SoftDriveMotorPara.TorqueConstant') ?? defaults.softDrive.TorqueConstant,
    },
    interpolator: {
      InterpolatorType: getEnumValue(interpolatorSet, 'InterpolatorType') ?? defaults.interpolator.InterpolatorType,
    },
    encoder: {
      VelocityFeedbackMode: getEnumValue(encoderSet, 'VelocityFeedbackMode') ?? defaults.encoder.VelocityFeedbackMode,
      PositionFeedbackMode: getEnumValue(encoderSet, 'PositionFeedbackMode') ?? defaults.encoder.PositionFeedbackMode,
      PositionLowPassFilter: getNumericValue(encoderSet, 'PositionLowPassFilter') ?? defaults.encoder.PositionLowPassFilter,
      VelocityFilterBandwidth: getNumericValue(encoderSet, 'VelocityFilterBandwidth') ?? defaults.encoder.VelocityFilterBandwidth,
      CorrectionFactor: getNumericValue(encoderSet, 'CorrectionFactor') ?? defaults.encoder.CorrectionFactor,
      SimulationOffset: getNumericValue(encoderSet, 'SimulationOffset') ?? defaults.encoder.SimulationOffset,
      CommutationErrorVelocity: getNumericValue(encoderSet, 'CommutationErrorVelocity') ?? defaults.encoder.CommutationErrorVelocity,
    },
    positionControl: {
      PositionLoopType: getEnumValue(posControlSet, 'PositionLoopType') ?? defaults.positionControl.PositionLoopType,
      Kp: getNumericValue(posControlSet, 'Kp') ?? defaults.positionControl.Kp,
      Kp_standstill: getNumericValue(posControlSet, 'Kp_standstill') ?? defaults.positionControl.Kp_standstill,
      Kp_area: getNumericValue(posControlSet, 'Kp_area') ?? defaults.positionControl.Kp_area,
      Kp_area_standstill: getNumericValue(posControlSet, 'Kp_area_standstill') ?? defaults.positionControl.Kp_area_standstill,
      Kp_ffv: getNumericValue(posControlSet, 'Kp_ffv') ?? defaults.positionControl.Kp_ffv,
      PosLoopFilter: getNumericValue(posControlSet, 'PosLoopFilter') ?? defaults.positionControl.PosLoopFilter,
      PosLoopFilter_area: getNumericValue(posControlSet, 'PosLoopFilter_area') ?? defaults.positionControl.PosLoopFilter_area,
      InpositionTn: getNumericValue(posControlSet, 'InpositionTn') ?? defaults.positionControl.InpositionTn,
    },
    velocityControl: {
      VelocityLoopType: getEnumValue(velControlSet, 'VelocityLoopType') ?? defaults.velocityControl.VelocityLoopType,
      Kp: getNumericValue(velControlSet, 'Kp') ?? defaults.velocityControl.Kp,
      Kp_standstill: getNumericValue(velControlSet, 'Kp_standstill') ?? defaults.velocityControl.Kp_standstill,
      Kp_area: getNumericValue(velControlSet, 'Kp_area') ?? defaults.velocityControl.Kp_area,
      Kp_area_standstill: getNumericValue(velControlSet, 'Kp_area_standstill') ?? defaults.velocityControl.Kp_area_standstill,
      Tn: getNumericValue(velControlSet, 'Tn') ?? defaults.velocityControl.Tn,
      Tn_standstill: getNumericValue(velControlSet, 'Tn_standstill') ?? defaults.velocityControl.Tn_standstill,
      Tn_area: getNumericValue(velControlSet, 'Tn_area') ?? defaults.velocityControl.Tn_area,
      Tn_area_standstill: getNumericValue(velControlSet, 'Tn_area_standstill') ?? defaults.velocityControl.Tn_area_standstill,
      Kd: getNumericValue(velControlSet, 'Kd') ?? defaults.velocityControl.Kd,
      Kd_standstill: getNumericValue(velControlSet, 'Kd_standstill') ?? defaults.velocityControl.Kd_standstill,
      Kd_area: getNumericValue(velControlSet, 'Kd_area') ?? defaults.velocityControl.Kd_area,
      Kd_area_standstill: getNumericValue(velControlSet, 'Kd_area_standstill') ?? defaults.velocityControl.Kd_area_standstill,
      MaxVelocity: getNumericValue(velControlSet, 'MaxVelocity') ?? defaults.velocityControl.MaxVelocity,
      ResetIPartAtMotionStart: getEnumValue(velControlSet, 'ResetIPartAtMotionStart') ?? defaults.velocityControl.ResetIPartAtMotionStart,
      ResetIPartWithBipolarCurrentLimitChange: getEnumValue(velControlSet, 'ResetIPartWithBipolarCurrentLimitChange') ?? defaults.velocityControl.ResetIPartWithBipolarCurrentLimitChange,
      ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit: getEnumValue(velControlSet, 'ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit') ?? defaults.velocityControl.ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit,
    },
    filter: {
      Type: getEnumValue(filterSet, 'ConfigurationFilter.Type') ?? defaults.filter.Type,
      Usage: getEnumValue(filterSet, 'ConfigurationFilter.Usage') ?? defaults.filter.Usage,
      LowPassFrequency: getNumericValue(filterSet, 'ConfigurationFilter.LowPassFrequency') ?? defaults.filter.LowPassFrequency,
      LowPassDamping: getNumericValue(filterSet, 'ConfigurationFilter.LowPassDamping') ?? defaults.filter.LowPassDamping,
      HighPassFrequency: getNumericValue(filterSet, 'ConfigurationFilter.HighPassFrequency') ?? defaults.filter.HighPassFrequency,
      HighPassDamping: getNumericValue(filterSet, 'ConfigurationFilter.HighPassDamping') ?? defaults.filter.HighPassDamping,
    },
    feedForward: {
      FeedforwardType: getEnumValue(feedForwardSet, 'FeedforwardType') ?? defaults.feedForward.FeedforwardType,
      KpAccFFT: getNumericValue(feedForwardSet, 'KpAccFFT') ?? defaults.feedForward.KpAccFFT,
      KpAccFFT_area: getNumericValue(feedForwardSet, 'KpAccFFT_area') ?? defaults.feedForward.KpAccFFT_area,
      FrictionCompensation: getNumericValue(feedForwardSet, 'FrictionCompensation') ?? defaults.feedForward.FrictionCompensation,
      FrictionCompensation_area: getNumericValue(feedForwardSet, 'FrictionCompensation_area') ?? defaults.feedForward.FrictionCompensation_area,
      KpVeloFFT: getNumericValue(feedForwardSet, 'KpVeloFFT') ?? defaults.feedForward.KpVeloFFT,
      OpenLoopMoveCurrent: getNumericValue(feedForwardSet, 'OpenLoopMoveCurrent') ?? defaults.feedForward.OpenLoopMoveCurrent,
      PhaseAdvanceAngle: getNumericValue(feedForwardSet, 'PhaseAdvanceAngle') ?? defaults.feedForward.PhaseAdvanceAngle,
      PhaseAdvanceSpeed: getNumericValue(feedForwardSet, 'PhaseAdvanceSpeed') ?? defaults.feedForward.PhaseAdvanceSpeed,
      CommutationFilter: getNumericValue(feedForwardSet, 'CommutationFilter') ?? defaults.feedForward.CommutationFilter,
      AreaCurrentLimit: getNumericValue(feedForwardSet, 'AreaCurrentLimit') ?? defaults.feedForward.AreaCurrentLimit,
      CurrentChangeLimit: getNumericValue(feedForwardSet, 'CurrentChangeLimit') ?? defaults.feedForward.CurrentChangeLimit,
      DetectionCurrentRamp: getNumericValue(feedForwardSet, 'DetectionCurrentRamp') ?? defaults.feedForward.DetectionCurrentRamp,
      DetectionMaxCurrent: getNumericValue(feedForwardSet, 'DetectionMaxCurrent') ?? defaults.feedForward.DetectionMaxCurrent,
      DetectionMinMovement: getNumericValue(feedForwardSet, 'DetectionMinMovement') ?? defaults.feedForward.DetectionMinMovement,
      DetectionFilter: getNumericValue(feedForwardSet, 'DetectionFilter') ?? defaults.feedForward.DetectionFilter,
    },
  }

  return {
    params,
    controlAreas: parseControlAreas(located.root),
    format: located.format,
  }
}
