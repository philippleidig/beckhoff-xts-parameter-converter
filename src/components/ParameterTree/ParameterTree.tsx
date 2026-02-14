import { useState, useMemo } from 'react'
import { hexToDataUrl } from '@/lib/icons/imageData'
import { ChevronRightIcon, ChevronDownIcon } from '@/components/ui/Icons'
import type { ParameterDependency } from '@/lib/converter/types'
import './ParameterTree.css'

export interface TreeModule {
  key: string
  label: string
  iconHex: string
  parameters: TreeParameter[]
}

export interface TreeParameter {
  key: string
  label: string
  value: string | number
  unit: string
  converted?: boolean
  renamedFrom?: string
  enumOptions?: string[]
  group?: string
  comment?: string
  dependsOn?: ParameterDependency
}

interface ParameterTreeProps {
  modules: TreeModule[]
  editable?: boolean
  defaultCollapsed?: boolean
  expandedModules?: Set<string>
  onToggleModule?: (key: string) => void
  onValueChange?: (moduleKey: string, paramKey: string, value: string | number) => void
  onParamClick?: (moduleKey: string, paramKey: string) => void
  highlightedParam?: string | null
  emptyMessage?: string
}

/** Group parameters by their group field, preserving order */
function groupParameters(params: TreeParameter[]): { group: string; params: TreeParameter[] }[] {
  const groups: { group: string; params: TreeParameter[] }[] = []
  const seen = new Map<string, number>()

  for (const p of params) {
    const g = p.group || 'General'
    const idx = seen.get(g)
    if (idx !== undefined) {
      groups[idx].params.push(p)
    } else {
      seen.set(g, groups.length)
      groups.push({ group: g, params: [p] })
    }
  }
  return groups
}

/** Check if a parameter is visible given current module parameter values */
function isParamVisible(
  param: TreeParameter,
  allParams: TreeParameter[]
): boolean {
  if (!param.dependsOn) return true
  const controllingParam = allParams.find((p) => p.key === param.dependsOn!.paramKey)
  if (!controllingParam) return true
  return param.dependsOn.values.includes(String(controllingParam.value))
}

export function ParameterTree({
  modules,
  editable = false,
  defaultCollapsed = false,
  expandedModules: controlledExpanded,
  onToggleModule,
  onValueChange,
  onParamClick,
  highlightedParam,
  emptyMessage = 'No parameters loaded',
}: ParameterTreeProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    defaultCollapsed ? new Set() : new Set(modules.map((m) => m.key))
  )
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const expandedModules = controlledExpanded ?? internalExpanded

  // Auto-expand the module that contains the highlighted parameter
  const highlightedModule = highlightedParam?.split(':')[0] ?? null
  const effectiveExpanded = highlightedModule && !expandedModules.has(highlightedModule)
    ? new Set([...expandedModules, highlightedModule])
    : expandedModules

  const toggleModule = (key: string) => {
    if (onToggleModule) {
      onToggleModule(key)
    } else {
      setInternalExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }
        return next
      })
    }
  }

  const toggleGroup = (moduleKey: string, groupName: string) => {
    const compositeKey = `${moduleKey}:${groupName}`
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(compositeKey)) {
        next.delete(compositeKey)
      } else {
        next.add(compositeKey)
      }
      return next
    })
  }

  // Compute grouped parameters with visibility filtering per module
  const groupedByModule = useMemo(() => {
    const result: Record<string, { group: string; params: TreeParameter[] }[]> = {}
    for (const mod of modules) {
      const visibleParams = mod.parameters.filter((p) => isParamVisible(p, mod.parameters))
      result[mod.key] = groupParameters(visibleParams)
    }
    return result
  }, [modules])

  if (modules.length === 0) {
    return <div className="tree-empty">{emptyMessage}</div>
  }

  return (
    <div className="parameter-tree">
      {modules.map((mod) => {
        const isExpanded = effectiveExpanded.has(mod.key)
        const groups = groupedByModule[mod.key] || []
        const hasMultipleGroups = groups.length > 1

        return (
          <div key={mod.key} className="tree-module">
            <div className="tree-module-header" onClick={() => toggleModule(mod.key)}>
              <span className="tree-toggle">
                {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
              </span>
              <img
                src={hexToDataUrl(mod.iconHex)}
                alt=""
                className="tree-module-icon"
                width={16}
                height={16}
              />
              <span className="tree-module-label">{mod.label}</span>
            </div>
            {isExpanded && (
              <div className="tree-params">
                {groups.map(({ group, params }) => {
                  const groupKey = `${mod.key}:${group}`
                  const isGroupCollapsed = collapsedGroups.has(groupKey)

                  return (
                    <div key={group} className="tree-group">
                      {hasMultipleGroups && (
                        <div
                          className="tree-group-header"
                          onClick={() => toggleGroup(mod.key, group)}
                        >
                          <span className="tree-group-toggle">
                            {isGroupCollapsed ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
                          </span>
                          <span className="tree-group-label">{group}</span>
                        </div>
                      )}
                      {!isGroupCollapsed && params.map((param) => {
                        const paramId = `${mod.key}:${param.key}`
                        const isHighlighted = highlightedParam === paramId
                        return (
                        <div
                          key={param.key}
                          className={`tree-param ${param.converted ? 'tree-param-converted' : ''} ${isHighlighted ? 'tree-param-highlighted' : ''}`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return
                            onParamClick?.(mod.key, param.key)
                          }}
                        >
                          <span className="tree-param-name" title={param.comment || undefined}>
                            {param.label}
                            {param.renamedFrom && (
                              <span className="tree-param-renamed" title={`Renamed from ${param.renamedFrom}`}>
                                *
                              </span>
                            )}
                          </span>
                          <span className="tree-param-value-group">
                            {editable && typeof param.value === 'number' ? (
                              <input
                                type="number"
                                className="tree-param-input"
                                value={param.value}
                                step="any"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value)
                                  if (!isNaN(val)) {
                                    onValueChange?.(mod.key, param.key, val)
                                  }
                                }}
                              />
                            ) : editable && typeof param.value === 'string' ? (
                              <select
                                className="tree-param-select"
                                value={param.value}
                                onChange={(e) => onValueChange?.(mod.key, param.key, e.target.value)}
                              >
                                {param.enumOptions ? (
                                  param.enumOptions.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))
                                ) : (
                                  <option value={param.value}>{param.value}</option>
                                )}
                              </select>
                            ) : (
                              <span className="tree-param-display">
                                {typeof param.value === 'number'
                                  ? formatNumber(param.value)
                                  : param.value}
                              </span>
                            )}
                            <span className="tree-param-unit">{param.unit || ''}</span>
                          </span>
                        </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString()
  const rounded = parseFloat(n.toFixed(4))
  return rounded.toString()
}
