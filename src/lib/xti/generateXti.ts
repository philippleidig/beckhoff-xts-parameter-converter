import type { MoverControllerParameters } from '@/lib/converter/types'
import { buildXtiXml } from './xtiTemplate'

function enumValue(name: string, text: string): string {
  return `\t\t\t\t\t<Value>\n\t\t\t\t\t\t<Name>${name}</Name>\n\t\t\t\t\t\t<EnumText>${text}</EnumText>\n\t\t\t\t\t</Value>`
}

function numericValue(name: string, val: number): string {
  return `\t\t\t\t\t<Value>\n\t\t\t\t\t\t<Name>${name}</Name>\n\t\t\t\t\t\t<Value>${val}</Value>\n\t\t\t\t\t</Value>`
}

function dataValue(name: string, data: string): string {
  return `\t\t\t\t\t<Value>\n\t\t\t\t\t\t<Name>${name}</Name>\n\t\t\t\t\t\t<Data>${data}</Data>\n\t\t\t\t\t</Value>`
}

function generalValues(p: MoverControllerParameters): string {
  return [
    enumValue('OperationMode', String(p.general.OperationMode)),
    numericValue('EmergencyRamp', p.general.EmergencyRamp),
    numericValue('EmergencyTimeOut', p.general.EmergencyTimeOut),
    numericValue('StandstillSwitchTime', p.general.StandstillSwitchTime),
    enumValue('StandstillSwitchMode', String(p.general.StandstillSwitchMode)),
    // No SoftDrive counterpart: MaxCurrentOutput is an amplifier current limit, not a
    // control force limit, so transferring it would enable a limit that was previously off.
    enumValue('EnableForceLimit', 'FALSE'),
    numericValue('ForceLimit', 0),
    enumValue('EnableForceLimitBeforeFeedForward', 'FALSE'),
    numericValue('ForceLimitBeforeFeedForward', 0),
    enumValue('InterpolatorType', String(p.general.InterpolatorType)),
    numericValue('CurrentChangeLimit', p.general.CurrentChangeLimit),
    numericValue('PhaseAdvance', p.general.PhaseAdvance),
    dataValue('ModuleId', '6dc7be9836d408429f8b486be57865bd'),
  ].join('\n')
}

function encoderValues(p: MoverControllerParameters): string {
  return [
    enumValue('VelocityFeedbackMode', String(p.encoder.VelocityFeedbackMode)),
    enumValue('PositionFeedbackMode', String(p.encoder.PositionFeedbackMode)),
    numericValue('PositionLowPassFilter', p.encoder.PositionLowPassFilter),
    numericValue('VelocityFilterBandwidth', p.encoder.VelocityFilterBandwidth),
    numericValue('ExternalPositionOid', 0),
    numericValue('ObserverCorrectionFactor', p.encoder.ObserverCorrectionFactor),
    numericValue('CommutationErrorVelocity', p.encoder.CommutationErrorVelocity),
    dataValue('ModuleId', '127c652a7c78c0408e6cd68fb6d58760'),
  ].join('\n')
}

function positionControlValues(p: MoverControllerParameters): string {
  return [
    enumValue('PositionLoopType', String(p.positionControl.PositionLoopType)),
    numericValue('Kp', p.positionControl.Kp),
    numericValue('Kp_standstill', p.positionControl.Kp_standstill),
    numericValue('Kp_precise_standstill', 0.006),
    numericValue('Kd_precise_standstill', 0.4),
    numericValue('Km_precise_standstill', 0.07),
    numericValue('SwitchingBoundary', 0),
    numericValue('PositionLoopFilter', p.positionControl.PositionLoopFilter),
    numericValue('InpositionTn', p.positionControl.InpositionTn),
    dataValue('ModuleId', '444e585785d0234d86e43be2859f4ec5'),
  ].join('\n')
}

function velocityControlValues(p: MoverControllerParameters): string {
  return [
    enumValue('VelocityLoopType', String(p.velocityControl.VelocityLoopType)),
    numericValue('Kp', p.velocityControl.Kp),
    numericValue('Kp_standstill', p.velocityControl.Kp_standstill),
    numericValue('Tn', p.velocityControl.Tn),
    numericValue('Tn_standstill', p.velocityControl.Tn_standstill),
    numericValue('Kd', p.velocityControl.Kd),
    numericValue('Kd_standstill', p.velocityControl.Kd_standstill),
    enumValue('ResetIPartAtMotionStart', String(p.velocityControl.ResetIPartAtMotionStart)),
    enumValue('ResetIPartWithBipolarForceLimitChange', String(p.velocityControl.ResetIPartWithBipolarForceLimitChange)),
    enumValue('ResetIPartWithFollErrorSignChangeAndBipolarForceLimit', String(p.velocityControl.ResetIPartWithFollErrorSignChangeAndBipolarForceLimit)),
    numericValue('MaxVelocity', p.velocityControl.MaxVelocity),
    dataValue('ModuleId', '17b5d8e95768d841a4a360c89603d74a'),
  ].join('\n')
}

function filterValues(p: MoverControllerParameters): string {
  return [
    enumValue('Type', String(p.filter.Type)),
    numericValue('LowPassFrequency', p.filter.LowPassFrequency),
    numericValue('LowPassDamping', p.filter.LowPassDamping),
    numericValue('HighPassFrequency', p.filter.HighPassFrequency),
    numericValue('HighPassDamping', p.filter.HighPassDamping),
    dataValue('ModuleId', 'd897ebfa6eed86498449630c65d48156'),
  ].join('\n')
}

function feedForwardValues(p: MoverControllerParameters): string {
  return [
    enumValue('Type', String(p.feedForward.Type)),
    numericValue('KpAccFFT', p.feedForward.KpAccFFT),
    numericValue('FrictionCompensation', p.feedForward.FrictionCompensation),
    numericValue('DetectionMinMovement', p.feedForward.DetectionMinMovement),
    numericValue('DetectionFilter', p.feedForward.DetectionFilter),
    numericValue('DetectionForceRamp', p.feedForward.DetectionForceRamp),
    numericValue('DetectionMaxForceLimitFactor', p.feedForward.DetectionMaxForceLimitFactor),
    numericValue('DetectionStandstillVelocityLimit', 15),
    numericValue('DetectionStandstillSwitchTime', 0.015),
    numericValue('DetectionTimeOut', 2),
    numericValue('DetectionVelocityFilterFrequency', 80),
    numericValue('DetectionVelocityFilterDamping', 2),
    enumValue('DetectionInfoMessage', 'FALSE'),
    numericValue('ExternalForceOid', 0),
    dataValue('ModuleId', '5e158b7e661ee1489d280607fa48fc11'),
  ].join('\n')
}

export function generateXti(params: MoverControllerParameters): string {
  return buildXtiXml({
    general: generalValues(params),
    encoder: encoderValues(params),
    positionControl: positionControlValues(params),
    velocityControl: velocityControlValues(params),
    filter: filterValues(params),
    feedForward: feedForwardValues(params),
  })
}

export function downloadXti(params: MoverControllerParameters, filename = 'MoverControllerParameterSet.xti'): void {
  const xml = generateXti(params)
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
