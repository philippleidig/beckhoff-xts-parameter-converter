import type { MoverControllerParameters } from '@/lib/converter/types'
import { createDefaultMoverControllerParameters } from '@/lib/converter/defaults'
import { getEnumValue, getNumericValue, parseXmlDocument } from './locate'
import { locateMoverController } from './moverControllerLocate'

/**
 * Reads a MoverController parameter set from a `.xti`.
 *
 * The counterpart of `generateXti`: values live in the same
 * `<ParameterValues><Value><Name>…` structure the SoftDrive formats use, so the
 * readers from `locate.ts` apply unchanged. Parameters the file does not carry fall
 * back to the TwinCAT defaults rather than failing, matching `parseSoftDriveXml`.
 */
export function parseMoverControllerXti(xmlString: string): MoverControllerParameters {
  const parsed = parseXmlDocument(xmlString)
  if ('error' in parsed) {
    throw new Error(`Invalid XML: ${parsed.error}`)
  }

  const located = locateMoverController(parsed.doc)
  if (!located) {
    throw new Error('No MoverController parameter set found in XML')
  }

  const defaults = createDefaultMoverControllerParameters()
  const {
    general: generalSet,
    encoder: encoderSet,
    positionControl: posControlSet,
    velocityControl: velControlSet,
    filter: filterSet,
    feedForward: feedForwardSet,
  } = located.modules

  return {
    general: {
      OperationMode: getEnumValue(generalSet, 'OperationMode') ?? defaults.general.OperationMode,
      EmergencyRamp: getNumericValue(generalSet, 'EmergencyRamp') ?? defaults.general.EmergencyRamp,
      EmergencyTimeOut: getNumericValue(generalSet, 'EmergencyTimeOut') ?? defaults.general.EmergencyTimeOut,
      StandstillSwitchTime: getNumericValue(generalSet, 'StandstillSwitchTime') ?? defaults.general.StandstillSwitchTime,
      StandstillSwitchMode: getEnumValue(generalSet, 'StandstillSwitchMode') ?? defaults.general.StandstillSwitchMode,
      InterpolatorType: getEnumValue(generalSet, 'InterpolatorType') ?? defaults.general.InterpolatorType,
      CurrentChangeLimit: getNumericValue(generalSet, 'CurrentChangeLimit') ?? defaults.general.CurrentChangeLimit,
      PhaseAdvance: getNumericValue(generalSet, 'PhaseAdvance') ?? defaults.general.PhaseAdvance,
    },
    encoder: {
      VelocityFeedbackMode: getEnumValue(encoderSet, 'VelocityFeedbackMode') ?? defaults.encoder.VelocityFeedbackMode,
      PositionFeedbackMode: getEnumValue(encoderSet, 'PositionFeedbackMode') ?? defaults.encoder.PositionFeedbackMode,
      PositionLowPassFilter: getNumericValue(encoderSet, 'PositionLowPassFilter') ?? defaults.encoder.PositionLowPassFilter,
      VelocityFilterBandwidth: getNumericValue(encoderSet, 'VelocityFilterBandwidth') ?? defaults.encoder.VelocityFilterBandwidth,
      ObserverCorrectionFactor: getNumericValue(encoderSet, 'ObserverCorrectionFactor') ?? defaults.encoder.ObserverCorrectionFactor,
      CommutationErrorVelocity: getNumericValue(encoderSet, 'CommutationErrorVelocity') ?? defaults.encoder.CommutationErrorVelocity,
    },
    positionControl: {
      PositionLoopType: getEnumValue(posControlSet, 'PositionLoopType') ?? defaults.positionControl.PositionLoopType,
      Kp: getNumericValue(posControlSet, 'Kp') ?? defaults.positionControl.Kp,
      Kp_standstill: getNumericValue(posControlSet, 'Kp_standstill') ?? defaults.positionControl.Kp_standstill,
      PositionLoopFilter: getNumericValue(posControlSet, 'PositionLoopFilter') ?? defaults.positionControl.PositionLoopFilter,
      InpositionTn: getNumericValue(posControlSet, 'InpositionTn') ?? defaults.positionControl.InpositionTn,
    },
    velocityControl: {
      VelocityLoopType: getEnumValue(velControlSet, 'VelocityLoopType') ?? defaults.velocityControl.VelocityLoopType,
      Kp: getNumericValue(velControlSet, 'Kp') ?? defaults.velocityControl.Kp,
      Kp_standstill: getNumericValue(velControlSet, 'Kp_standstill') ?? defaults.velocityControl.Kp_standstill,
      Tn: getNumericValue(velControlSet, 'Tn') ?? defaults.velocityControl.Tn,
      Tn_standstill: getNumericValue(velControlSet, 'Tn_standstill') ?? defaults.velocityControl.Tn_standstill,
      Kd: getNumericValue(velControlSet, 'Kd') ?? defaults.velocityControl.Kd,
      Kd_standstill: getNumericValue(velControlSet, 'Kd_standstill') ?? defaults.velocityControl.Kd_standstill,
      ResetIPartAtMotionStart: getEnumValue(velControlSet, 'ResetIPartAtMotionStart') ?? defaults.velocityControl.ResetIPartAtMotionStart,
      ResetIPartWithBipolarForceLimitChange: getEnumValue(velControlSet, 'ResetIPartWithBipolarForceLimitChange') ?? defaults.velocityControl.ResetIPartWithBipolarForceLimitChange,
      ResetIPartWithFollErrorSignChangeAndBipolarForceLimit: getEnumValue(velControlSet, 'ResetIPartWithFollErrorSignChangeAndBipolarForceLimit') ?? defaults.velocityControl.ResetIPartWithFollErrorSignChangeAndBipolarForceLimit,
      MaxVelocity: getNumericValue(velControlSet, 'MaxVelocity') ?? defaults.velocityControl.MaxVelocity,
    },
    filter: {
      Type: getEnumValue(filterSet, 'Type') ?? defaults.filter.Type,
      LowPassFrequency: getNumericValue(filterSet, 'LowPassFrequency') ?? defaults.filter.LowPassFrequency,
      LowPassDamping: getNumericValue(filterSet, 'LowPassDamping') ?? defaults.filter.LowPassDamping,
      HighPassFrequency: getNumericValue(filterSet, 'HighPassFrequency') ?? defaults.filter.HighPassFrequency,
      HighPassDamping: getNumericValue(filterSet, 'HighPassDamping') ?? defaults.filter.HighPassDamping,
    },
    feedForward: {
      Type: getEnumValue(feedForwardSet, 'Type') ?? defaults.feedForward.Type,
      KpAccFFT: getNumericValue(feedForwardSet, 'KpAccFFT') ?? defaults.feedForward.KpAccFFT,
      FrictionCompensation: getNumericValue(feedForwardSet, 'FrictionCompensation') ?? defaults.feedForward.FrictionCompensation,
      DetectionMinMovement: getNumericValue(feedForwardSet, 'DetectionMinMovement') ?? defaults.feedForward.DetectionMinMovement,
      DetectionFilter: getNumericValue(feedForwardSet, 'DetectionFilter') ?? defaults.feedForward.DetectionFilter,
      DetectionForceRamp: getNumericValue(feedForwardSet, 'DetectionForceRamp') ?? defaults.feedForward.DetectionForceRamp,
      DetectionMaxForceLimitFactor: getNumericValue(feedForwardSet, 'DetectionMaxForceLimitFactor') ?? defaults.feedForward.DetectionMaxForceLimitFactor,
    },
  }
}
