import { useMemo, useState, useCallback } from 'react'
import { ParameterTree } from '@/components/ParameterTree/ParameterTree'
import type { TreeModule } from '@/components/ParameterTree/ParameterTree'
import { Modal } from '@/components/ui/Modal'
import { useParameterStore } from '@/stores/parameterStore'
import { SD_MODULES, MC_MODULES } from '@/lib/converter/modules'
import { SD_PARAMETER_META, MC_PARAMETER_META } from '@/lib/converter/types'
import type { SoftDriveParameters, ParameterMeta } from '@/lib/converter/types'
import type { ParameterSetVariant } from '@/lib/converter/areas'
import './DetailsModal.css'

// Mapping: source "module:param" → target "module:param"
const SOURCE_TO_TARGET: Record<string, string> = {
  'softDrive:OperationMode': 'general:OperationMode',
  'softDrive:EmergencyRamp': 'general:EmergencyRamp',
  'softDrive:EmergencyTimeOut': 'general:EmergencyTimeOut',
  'softDrive:StandstillSwitchTime': 'general:StandstillSwitchTime',
  'softDrive:StandstillSwitchMode': 'general:StandstillSwitchMode',
  'interpolator:InterpolatorType': 'general:InterpolatorType',
  'feedForward:CurrentChangeLimit': 'general:CurrentChangeLimit',
  'feedForward:PhaseAdvanceAngle': 'general:PhaseAdvance',
  'encoder:VelocityFeedbackMode': 'encoder:VelocityFeedbackMode',
  'encoder:PositionFeedbackMode': 'encoder:PositionFeedbackMode',
  'encoder:PositionLowPassFilter': 'encoder:PositionLowPassFilter',
  'encoder:VelocityFilterBandwidth': 'encoder:VelocityFilterBandwidth',
  'encoder:CorrectionFactor': 'encoder:ObserverCorrectionFactor',
  'encoder:CommutationErrorVelocity': 'encoder:CommutationErrorVelocity',
  'positionControl:PositionLoopType': 'positionControl:PositionLoopType',
  'positionControl:Kp': 'positionControl:Kp',
  'positionControl:Kp_standstill': 'positionControl:Kp_standstill',
  'positionControl:PosLoopFilter': 'positionControl:PositionLoopFilter',
  'positionControl:InpositionTn': 'positionControl:InpositionTn',
  'velocityControl:VelocityLoopType': 'velocityControl:VelocityLoopType',
  'velocityControl:Kp': 'velocityControl:Kp',
  'velocityControl:Kp_standstill': 'velocityControl:Kp_standstill',
  'velocityControl:Tn': 'velocityControl:Tn',
  'velocityControl:Tn_standstill': 'velocityControl:Tn_standstill',
  'velocityControl:Kd': 'velocityControl:Kd',
  'velocityControl:Kd_standstill': 'velocityControl:Kd_standstill',
  'velocityControl:MaxVelocity': 'velocityControl:MaxVelocity',
  'velocityControl:ResetIPartAtMotionStart': 'velocityControl:ResetIPartAtMotionStart',
  'velocityControl:ResetIPartWithBipolarCurrentLimitChange': 'velocityControl:ResetIPartWithBipolarForceLimitChange',
  'velocityControl:ResetIPartWithFollErrorSignChangeAndBipolarCurrentLimit': 'velocityControl:ResetIPartWithFollErrorSignChangeAndBipolarForceLimit',
  'filter:Type': 'filter:Type',
  'filter:LowPassFrequency': 'filter:LowPassFrequency',
  'filter:LowPassDamping': 'filter:LowPassDamping',
  'filter:HighPassFrequency': 'filter:HighPassFrequency',
  'filter:HighPassDamping': 'filter:HighPassDamping',
  'feedForward:FeedforwardType': 'feedForward:Type',
  'feedForward:KpAccFFT': 'feedForward:KpAccFFT',
  'feedForward:FrictionCompensation': 'feedForward:FrictionCompensation',
  'feedForward:DetectionMinMovement': 'feedForward:DetectionMinMovement',
  'feedForward:DetectionFilter': 'feedForward:DetectionFilter',
  'feedForward:DetectionCurrentRamp': 'feedForward:DetectionForceRamp',
  'feedForward:DetectionMaxCurrent': 'feedForward:DetectionMaxForceLimitFactor',
}

/** In the area variant the `_area` inputs drive the converted values instead. */
const AREA_SOURCE_OVERRIDES: Record<string, string> = {
  'positionControl:Kp_area': 'positionControl:Kp',
  'positionControl:Kp_area_standstill': 'positionControl:Kp_standstill',
  'positionControl:PosLoopFilter_area': 'positionControl:PositionLoopFilter',
  'velocityControl:Kp_area': 'velocityControl:Kp',
  'velocityControl:Kp_area_standstill': 'velocityControl:Kp_standstill',
  'velocityControl:Tn_area': 'velocityControl:Tn',
  'velocityControl:Tn_area_standstill': 'velocityControl:Tn_standstill',
  'velocityControl:Kd_area': 'velocityControl:Kd',
  'velocityControl:Kd_area_standstill': 'velocityControl:Kd_standstill',
  'feedForward:KpAccFFT_area': 'feedForward:KpAccFFT',
  'feedForward:FrictionCompensation_area': 'feedForward:FrictionCompensation',
}

/** Base mappings that the area variant replaces, so they must not stay linked. */
const AREA_REPLACED_SOURCES = new Set(
  Object.values(AREA_SOURCE_OVERRIDES).flatMap((target) =>
    Object.entries(SOURCE_TO_TARGET)
      .filter(([, t]) => t === target)
      .map(([s]) => s)
  )
)

function buildMappings(variant: ParameterSetVariant) {
  const sourceToTarget: Record<string, string> = { ...SOURCE_TO_TARGET }

  if (variant === 'area') {
    for (const source of AREA_REPLACED_SOURCES) delete sourceToTarget[source]
    Object.assign(sourceToTarget, AREA_SOURCE_OVERRIDES)
  }

  const targetToSource = Object.fromEntries(
    Object.entries(sourceToTarget).map(([s, t]) => [t, s])
  )
  return { sourceToTarget, targetToSource }
}

function buildParams(
  moduleParams: Record<string, string | number>,
  metaMap: Record<string, ParameterMeta>
) {
  return Object.entries(metaMap).map(([key, meta]) => ({
    key,
    label: meta.displayName,
    value: moduleParams[key] as string | number,
    unit: meta.unit,
    enumOptions: meta.enumOptions,
    group: meta.group,
    comment: meta.comment,
    dependsOn: meta.dependsOn,
  }))
}

function buildSourceModules(params: SoftDriveParameters): TreeModule[] {
  const asRecord = params as unknown as Record<string, Record<string, string | number>>
  return SD_MODULES.map((module) => ({
    ...module,
    parameters: buildParams(asRecord[module.key], SD_PARAMETER_META[module.key]),
  }))
}

function buildTargetModules(converted: Record<string, Record<string, string | number>>): TreeModule[] {
  return MC_MODULES.map((module) => ({
    ...module,
    parameters: Object.entries(MC_PARAMETER_META[module.key]).map(([key, meta]) => ({
      key,
      label: meta.displayName,
      value: converted[module.key][key],
      unit: meta.unit,
      converted: meta.converted,
      renamedFrom: meta.renamedFrom,
      group: meta.group,
      comment: meta.comment,
      dependsOn: meta.dependsOn,
    })),
  }))
}

const ALL_MODULES = SD_MODULES.map((module) => module.key)

interface DetailsModalProps {
  open: boolean
  onClose: () => void
}

export function DetailsModal({ open, onClose }: DetailsModalProps) {
  const { softDriveParams, setSoftDriveParam, getConvertedParams, selectedMagnetPlateType, hasAreaSet } =
    useParameterStore()

  const [variant, setVariant] = useState<ParameterSetVariant>('base')
  const showVariantToggle = hasAreaSet()

  // Shared expand/collapse state using source module keys as canonical keys
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(ALL_MODULES))

  // Mapping between source and target module keys. The target's General module holds both
  // the SoftDrive-level parameters and the interpolator type.
  const sourceToTargetModule = useCallback(
    (key: string) => (key === 'interpolator' || key === 'softDrive' ? 'general' : key),
    []
  )
  const targetToSourceModule = useCallback((key: string) => (key === 'general' ? 'softDrive' : key), [])

  const sourceExpanded = expandedModules
  const targetExpanded = useMemo(
    () => new Set([...expandedModules].map(sourceToTargetModule)),
    [expandedModules, sourceToTargetModule]
  )

  const handleToggleFromSource = useCallback((key: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleToggleFromTarget = useCallback(
    (key: string) => {
      const canonicalKey = targetToSourceModule(key)
      setExpandedModules((prev) => {
        const next = new Set(prev)
        if (next.has(canonicalKey)) next.delete(canonicalKey)
        else next.add(canonicalKey)
        return next
      })
    },
    [targetToSourceModule]
  )

  // Selection state: which parameter is selected, identified as "module:param"
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

  const { sourceToTarget, targetToSource } = useMemo(() => buildMappings(variant), [variant])

  const handleSourceParamClick = useCallback(
    (moduleKey: string, paramKey: string) => {
      const key = `${moduleKey}:${paramKey}`
      if (selectedSource === key) {
        setSelectedSource(null)
        setSelectedTarget(null)
      } else {
        setSelectedSource(key)
        setSelectedTarget(sourceToTarget[key] ?? null)
      }
    },
    [selectedSource, sourceToTarget]
  )

  const handleTargetParamClick = useCallback(
    (moduleKey: string, paramKey: string) => {
      const key = `${moduleKey}:${paramKey}`
      if (selectedTarget === key) {
        setSelectedSource(null)
        setSelectedTarget(null)
      } else {
        setSelectedTarget(key)
        setSelectedSource(targetToSource[key] ?? null)
      }
    },
    [selectedTarget, targetToSource]
  )

  // getConvertedParams reads the store through get(), so the lint rule cannot see that
  // it depends on the parameters and the magnet plate — they must stay in the deps.
  const convertedParams = useMemo(
    () => getConvertedParams(variant),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [softDriveParams, selectedMagnetPlateType, variant, getConvertedParams]
  )

  const sourceModules = useMemo(
    () => (softDriveParams ? buildSourceModules(softDriveParams) : []),
    [softDriveParams]
  )

  const targetModules = useMemo(() => {
    if (!convertedParams) return []
    return buildTargetModules(convertedParams as unknown as Record<string, Record<string, string | number>>)
  }, [convertedParams])

  const handleSourceValueChange = (moduleKey: string, paramKey: string, value: string | number) => {
    setSoftDriveParam(moduleKey as keyof SoftDriveParameters, paramKey as never, value)
  }

  const variantToggle = showVariantToggle ? (
    <div className="details-variant" role="group" aria-label="Parameter set variant">
      <button
        type="button"
        className={`details-variant-btn ${variant === 'base' ? 'is-active' : ''}`}
        onClick={() => setVariant('base')}
      >
        Base set
      </button>
      <button
        type="button"
        className={`details-variant-btn ${variant === 'area' ? 'is-active' : ''}`}
        onClick={() => setVariant('area')}
      >
        Area set
      </button>
    </div>
  ) : undefined

  return (
    <Modal open={open} title="Converted parameters" onClose={onClose} size="full" headerExtra={variantToggle}>
      {variant === 'area' && (
        <p className="details-hint">
          Showing the area parameter set. The converted values are derived from the SoftDrive
          <code>_area</code> parameters, which are highlighted on the left when you select a converted value.
        </p>
      )}
      <div className="details-columns">
        <section className="details-column">
          <h3 className="details-column-title">SoftDrive Parameters</h3>
          <ParameterTree
            modules={sourceModules}
            editable
            expandedModules={sourceExpanded}
            onToggleModule={handleToggleFromSource}
            onValueChange={handleSourceValueChange}
            onParamClick={handleSourceParamClick}
            highlightedParam={selectedSource}
            emptyMessage="Import a file or load defaults to begin"
          />
        </section>

        <section className="details-column">
          <h3 className="details-column-title">
            MoverController Parameters{variant === 'area' ? ' — Area' : ''}
          </h3>
          <ParameterTree
            modules={targetModules}
            expandedModules={targetExpanded}
            onToggleModule={handleToggleFromTarget}
            onParamClick={handleTargetParamClick}
            highlightedParam={selectedTarget}
            emptyMessage="No conversion result"
          />
        </section>
      </div>
    </Modal>
  )
}
