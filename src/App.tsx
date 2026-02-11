import { useMemo, useState, useCallback } from 'react'
import { Header } from '@/components/Header/Header'
import { SettingsPanel } from '@/components/SettingsPanel/SettingsPanel'
import { ParameterTree } from '@/components/ParameterTree/ParameterTree'
import type { TreeModule } from '@/components/ParameterTree/ParameterTree'
import { useParameterStore } from '@/stores/parameterStore'
import { SD_ICONS, MC_ICONS } from '@/lib/icons/imageData'
import { SD_PARAMETER_META, MC_PARAMETER_META } from '@/lib/converter/types'
import type { SoftDriveParameters } from '@/lib/converter/types'
import { Card } from '@/components/ui/Card'
import './App.css'

// Mapping: source "module:param" → target "module:param"
const SOURCE_TO_TARGET: Record<string, string> = {
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

// Build reverse mapping: target → source
const TARGET_TO_SOURCE: Record<string, string> = Object.fromEntries(
  Object.entries(SOURCE_TO_TARGET).map(([s, t]) => [t, s])
)

function buildSourceModules(params: SoftDriveParameters): TreeModule[] {
  const buildParams = (
    moduleParams: Record<string, string | number>,
    metaMap: Record<string, import('@/lib/converter/types').ParameterMeta>
  ) =>
    Object.entries(metaMap).map(([key, meta]) => ({
      key,
      label: meta.displayName,
      value: moduleParams[key] as string | number,
      unit: meta.unit,
      enumOptions: meta.enumOptions,
      group: meta.group,
      comment: meta.comment,
      dependsOn: meta.dependsOn,
    }))

  return [
    { key: 'interpolator', label: 'Interpolator', iconHex: SD_ICONS.interpolator, parameters: buildParams(params.interpolator as unknown as Record<string, string | number>, SD_PARAMETER_META.interpolator) },
    { key: 'encoder', label: 'Encoder', iconHex: SD_ICONS.encoder, parameters: buildParams(params.encoder as unknown as Record<string, string | number>, SD_PARAMETER_META.encoder) },
    { key: 'positionControl', label: 'Position Control', iconHex: SD_ICONS.positionControl, parameters: buildParams(params.positionControl as unknown as Record<string, string | number>, SD_PARAMETER_META.positionControl) },
    { key: 'velocityControl', label: 'Velocity Control', iconHex: SD_ICONS.velocityControl, parameters: buildParams(params.velocityControl as unknown as Record<string, string | number>, SD_PARAMETER_META.velocityControl) },
    { key: 'filter', label: 'Filter', iconHex: SD_ICONS.filter, parameters: buildParams(params.filter as unknown as Record<string, string | number>, SD_PARAMETER_META.filter) },
    { key: 'feedForward', label: 'Feed Forward', iconHex: SD_ICONS.feedForward, parameters: buildParams(params.feedForward as unknown as Record<string, string | number>, SD_PARAMETER_META.feedForward) },
  ]
}

function buildTargetModules(converted: Record<string, Record<string, string | number>>): TreeModule[] {
  const buildModuleParams = (moduleKey: string) =>
    Object.entries(MC_PARAMETER_META[moduleKey]).map(([key, meta]) => ({
      key,
      label: meta.displayName,
      value: converted[moduleKey][key],
      unit: meta.unit,
      converted: meta.converted,
      renamedFrom: meta.renamedFrom,
      group: meta.group,
      comment: meta.comment,
      dependsOn: meta.dependsOn,
    }))

  return [
    { key: 'general', label: 'General', iconHex: MC_ICONS.general, parameters: buildModuleParams('general') },
    { key: 'encoder', label: 'Encoder', iconHex: MC_ICONS.encoder, parameters: buildModuleParams('encoder') },
    { key: 'positionControl', label: 'Position Control', iconHex: MC_ICONS.positionControl, parameters: buildModuleParams('positionControl') },
    { key: 'velocityControl', label: 'Velocity Control', iconHex: MC_ICONS.velocityControl, parameters: buildModuleParams('velocityControl') },
    { key: 'filter', label: 'Filter', iconHex: MC_ICONS.filter, parameters: buildModuleParams('filter') },
    { key: 'feedForward', label: 'Feed Forward', iconHex: MC_ICONS.feedForward, parameters: buildModuleParams('feedForward') },
  ]
}

export default function App() {
  const { softDriveParams, setSoftDriveParam, getConvertedParams, selectedMoverType } =
    useParameterStore()

  // Selection state: which parameter is selected, identified as "module:param"
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

  const handleSourceParamClick = useCallback((moduleKey: string, paramKey: string) => {
    const key = `${moduleKey}:${paramKey}`
    if (selectedSource === key) {
      setSelectedSource(null)
      setSelectedTarget(null)
    } else {
      setSelectedSource(key)
      setSelectedTarget(SOURCE_TO_TARGET[key] ?? null)
    }
  }, [selectedSource])

  const handleTargetParamClick = useCallback((moduleKey: string, paramKey: string) => {
    const key = `${moduleKey}:${paramKey}`
    if (selectedTarget === key) {
      setSelectedSource(null)
      setSelectedTarget(null)
    } else {
      setSelectedTarget(key)
      setSelectedSource(TARGET_TO_SOURCE[key] ?? null)
    }
  }, [selectedTarget])

  const convertedParams = useMemo(() => getConvertedParams(), [softDriveParams, selectedMoverType, getConvertedParams])

  const sourceModules = useMemo(
    () => (softDriveParams ? buildSourceModules(softDriveParams) : []),
    [softDriveParams]
  )

  const targetModules = useMemo(() => {
    if (!convertedParams) return []
    const asRecord = convertedParams as unknown as Record<string, Record<string, string | number>>
    return buildTargetModules(asRecord)
  }, [convertedParams])

  const handleSourceValueChange = (moduleKey: string, paramKey: string, value: string | number) => {
    setSoftDriveParam(
      moduleKey as keyof SoftDriveParameters,
      paramKey as never,
      value
    )
  }

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <aside className="app-sidebar">
          <SettingsPanel />
        </aside>

        <section className="app-column">
          <Card title="SoftDrive Parameters (Source)">
            <ParameterTree
              modules={sourceModules}
              editable
              onValueChange={handleSourceValueChange}
              onParamClick={handleSourceParamClick}
              highlightedParam={selectedSource}
              emptyMessage="Import an XML file or load defaults to begin"
            />
          </Card>
        </section>

        <section className="app-column">
          <Card title="MoverController Parameters (Converted)">
            {!softDriveParams ? (
              <div className="app-placeholder">Import or enter parameters first</div>
            ) : !selectedMoverType ? (
              <div className="app-placeholder">Select a mover type to see converted values</div>
            ) : (
              <ParameterTree
                modules={targetModules}
                onParamClick={handleTargetParamClick}
                highlightedParam={selectedTarget}
                emptyMessage="No conversion result"
              />
            )}
          </Card>
        </section>
      </main>
      <footer className="app-disclaimer">
        This project is an independent, community-driven tool. It is <strong>not affiliated with, endorsed by, supported by, or maintained by Beckhoff Automation GmbH &amp; Co. KG</strong> in any way.
        This is <strong>not a Beckhoff product</strong>. "Beckhoff", "XTS", "TwinCAT", and related names are trademarks of Beckhoff Automation.
        All converted parameter values should be thoroughly reviewed and validated before being used in any production environment.
        The authors assume no liability for any damages or losses resulting from the use of this tool. Use at your own risk.
      </footer>
    </div>
  )
}
