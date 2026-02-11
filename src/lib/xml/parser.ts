import { MODULE_TYPE_IDS, SOFTDRIVE_TYPE_IDS } from '@/lib/constants/moverTypes'
import type { SoftDriveParameters } from '@/lib/converter/types'
import { createDefaultSoftDriveParameters } from '@/lib/converter/defaults'

export function parseSoftDriveXml(xmlString: string): SoftDriveParameters {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent}`)
  }

  const softDriveSet = findSoftDriveParameterSet(doc)
  if (!softDriveSet) {
    throw new Error('No SoftDrive ParameterSet found in XML')
  }

  const defaults = createDefaultSoftDriveParameters()

  const interpolatorSet = findChildParameterSetByTypeId(softDriveSet, MODULE_TYPE_IDS.interpolator)
  const encoderSet = findChildParameterSetByTypeId(softDriveSet, MODULE_TYPE_IDS.encoder)
  const posControlSet = findChildParameterSetByTypeId(softDriveSet, MODULE_TYPE_IDS.positionControl)
  const velControlSet = findChildParameterSetByTypeId(softDriveSet, MODULE_TYPE_IDS.velocityControl)
  const filterSet = findChildParameterSetByTypeId(softDriveSet, MODULE_TYPE_IDS.filter)
  const feedForwardSet = findChildParameterSetByTypeId(softDriveSet, MODULE_TYPE_IDS.feedForward)

  return {
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
}

function findSoftDriveParameterSet(doc: Document): Element | null {
  const allSets = doc.querySelectorAll('ParameterSet')
  for (const typeId of SOFTDRIVE_TYPE_IDS) {
    for (const set of allSets) {
      const typeIdEl = set.querySelector(':scope > TypeId')
      if (typeIdEl?.textContent?.trim().toLowerCase() === typeId.toLowerCase()) {
        return set
      }
    }
  }
  // Fallback: find by Name containing "SoftDrive"
  for (const set of allSets) {
    const nameEl = set.querySelector(':scope > Name')
    if (nameEl?.textContent?.toLowerCase().includes('softdrive')) {
      return set
    }
  }
  return null
}

function findChildParameterSetByTypeId(parent: Element, typeId: string): Element | null {
  const paramSets = parent.querySelectorAll(':scope > ParameterSets > ParameterSet')
  for (const set of paramSets) {
    const typeIdEl = set.querySelector(':scope > TypeId')
    if (typeIdEl?.textContent?.trim().toLowerCase() === typeId.toLowerCase()) {
      return set
    }
  }
  return null
}

function getNumericValue(paramSet: Element | null, name: string): number | null {
  if (!paramSet) return null
  const values = paramSet.querySelectorAll(':scope > ParameterValues > Value')
  for (const val of values) {
    const nameEl = val.querySelector(':scope > Name')
    if (nameEl?.textContent?.trim() === name) {
      const valueEl = val.querySelector(':scope > Value')
      if (valueEl?.textContent) {
        const num = parseFloat(valueEl.textContent.trim())
        if (!isNaN(num)) return num
      }
    }
  }
  return null
}

function getEnumValue(paramSet: Element | null, name: string): string | null {
  if (!paramSet) return null
  const values = paramSet.querySelectorAll(':scope > ParameterValues > Value')
  for (const val of values) {
    const nameEl = val.querySelector(':scope > Name')
    if (nameEl?.textContent?.trim() === name) {
      const enumEl = val.querySelector(':scope > EnumText')
      if (enumEl?.textContent) return enumEl.textContent.trim()
      const valueEl = val.querySelector(':scope > Value')
      if (valueEl?.textContent) return valueEl.textContent.trim()
    }
  }
  return null
}
