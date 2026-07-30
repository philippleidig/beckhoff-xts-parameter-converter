import { useCallback, useMemo, useRef, useState } from 'react'
import { useCreateStore } from '@/stores/createStore'
import { ViewHeader } from '@/components/Layout/ViewHeader'
import { ParameterTree } from '@/components/ParameterTree/ParameterTree'
import type { TreeModule } from '@/components/ParameterTree/ParameterTree'
import { XtiExportPanel } from '@/components/Export/XtiExportPanel'
import type { ExportableSet } from '@/components/Export/XtiExportPanel'
import { Button } from '@/components/ui/Button'
import { AlertIcon, FileXtiIcon, ResetIcon } from '@/components/ui/Icons'
import { mcModules, mcParameterMeta } from '@/lib/tmc/registry'
import type { MoverControllerParameters } from '@/lib/converter/types'
import { readParameterFile } from '@/lib/files/readParameterFile'
import './CreateView.css'
import { useTmcVersionStore } from '@/stores/tmcVersionStore'

const DEFAULT_FILENAME = 'MoverControllerParameterSet.xti'

function buildModules(
  params: MoverControllerParameters,
  descriptors: ReturnType<typeof mcModules>,
  meta: ReturnType<typeof mcParameterMeta>
): TreeModule[] {
  const asRecord = params as unknown as Record<string, Record<string, string | number>>
  return descriptors.map((module) => ({
    ...module,
    parameters: Object.entries(meta[module.key]).map(([key, meta]) => ({
      key,
      label: meta.displayName,
      value: asRecord[module.key][key],
      unit: meta.unit,
      enumOptions: meta.enumOptions,
      group: meta.group,
      comment: meta.comment,
      dependsOn: meta.dependsOn,
    })),
  }))
}

interface CreateViewProps {
  onBack: () => void
}

export function CreateView({ onBack }: CreateViewProps) {
  // Parameter names, units and enum values come from the selected driver version,
  // so this view has to re-render when it changes.
  const tmcVersion = useTmcVersionStore((state) => state.version)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [readError, setReadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState(DEFAULT_FILENAME)

  const { params, sourceFileName, modified, validationErrors, setParam, loadFromFile, reset } =
    useCreateStore()

  const modules = useMemo(
    () => buildModules(params, mcModules(), mcParameterMeta()),
    // tmcVersion is not read here, but it is what makes mcModules() and
    // mcParameterMeta() return a different driver's metadata.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
    [params, tmcVersion]
  )

  // The parameters are read at click time so the export always carries the latest edit.
  const sets = useMemo<ExportableSet[]>(
    () => [
      {
        id: 'created',
        label: 'Download parameter set',
        fileName: fileName.trim() || DEFAULT_FILENAME,
        getParams: () => useCreateStore.getState().params,
      },
    ],
    [fileName]
  )

  const handleFile = useCallback(
    (file: File) => {
      setReadError(null)
      readParameterFile(file).then(
        (content) => loadFromFile(content, file.name),
        (err: Error) => setReadError(err.message)
      )
    },
    [loadFromFile]
  )

  const handleValueChange = (moduleKey: string, paramKey: string, value: string | number) => {
    setParam(moduleKey as keyof MoverControllerParameters, paramKey as never, value)
  }

  return (
    <div className="create-view">
      <ViewHeader
        title="Create a MoverController parameter set"
        description="Start from the TwinCAT default values, adjust what you need and export the result as an XTI file."
        onBack={onBack}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileXtiIcon size={14} />
              Start from an XTI
            </Button>
            <Button variant="ghost" size="sm" onClick={reset} disabled={!modified}>
              <ResetIcon size={14} />
              Reset to defaults
            </Button>
          </>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xti,.xml"
        className="create-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {(readError || validationErrors.length > 0) && (
        <div className="create-messages">
          {[...(readError ? [readError] : []), ...validationErrors].map((message, i) => (
            <p key={i} className="create-message-error">
              <AlertIcon size={14} />
              <span>{message}</span>
            </p>
          ))}
        </div>
      )}

      <div className="create-columns">
        <section className="create-parameters">
          <h3 className="create-section-title">
            MoverController Parameters
            <span className="create-source">
              {sourceFileName ? `from ${sourceFileName}` : modified ? 'edited defaults' : 'TwinCAT defaults'}
            </span>
          </h3>
          <ParameterTree
            modules={modules}
            editable
            onValueChange={handleValueChange}
            emptyMessage="No parameters"
          />
        </section>

        <aside className="create-export">
          <h3 className="create-section-title">Export</h3>
          <label className="create-filename">
            File name
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              spellCheck={false}
            />
          </label>
          <XtiExportPanel sets={sets} />
        </aside>
      </div>
    </div>
  )
}
