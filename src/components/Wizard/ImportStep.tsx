import { useCallback, useRef, useState } from 'react'
import { useParameterStore } from '@/stores/parameterStore'
import { HelpButton } from '@/components/Help/HelpButton'
import { UploadIcon, FileIcon, FileXtiIcon, SlidersIcon, AlertIcon, WarningIcon, ResetIcon } from '@/components/ui/Icons'
import { Button } from '@/components/ui/Button'
import './ImportStep.css'

type ImportSource = 'parameterSet' | 'moverAxisXti'

const SOURCE_LABELS: Record<ImportSource, { title: string; hint: string; accept: string }> = {
  parameterSet: {
    title: 'Import Parameter Set',
    hint: 'XML exported from the XTS Configurator',
    accept: '.xml',
  },
  moverAxisXti: {
    title: 'Import Mover Axis XTI',
    hint: 'XTI saved from the TwinCAT Solution Explorer',
    accept: '.xti',
  },
}

const FORMAT_LABELS: Record<string, string> = {
  parameterSet: 'Parameter Set (XML)',
  moverAxisXti: 'Mover Axis (XTI)',
}

const ACCEPTED_EXTENSIONS = ['.xml', '.xti']

/** Generous ceiling: the bundled samples are 40–250 kB. */
const MAX_FILE_BYTES = 32 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImportStep() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingSource, setPendingSource] = useState<ImportSource>('parameterSet')
  const [isDragging, setIsDragging] = useState(false)

  const {
    softDriveParams,
    sourceFormat,
    sourceFileName,
    controlAreas,
    validationErrors,
    validationWarnings,
    importFromFile,
    loadDefaults,
    resetParameters,
  } = useParameterStore()

  const [readError, setReadError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setReadError(null)

      if (!ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
        setReadError(`'${file.name}' is not an .xml or .xti file.`)
        return
      }
      if (file.size === 0) {
        setReadError(`'${file.name}' is empty.`)
        return
      }
      // Parameter exports are a few hundred kB. A much larger file is not one of
      // them, and parsing it would lock up the browser.
      if (file.size > MAX_FILE_BYTES) {
        setReadError(
          `'${file.name}' is ${formatBytes(file.size)}, larger than the ${formatBytes(MAX_FILE_BYTES)} limit ` +
          `for a parameter export. Check that this is the right file.`
        )
        return
      }

      const reader = new FileReader()
      reader.onerror = () => setReadError(`'${file.name}' could not be read.`)
      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content !== 'string') {
          setReadError(`'${file.name}' could not be read as text.`)
          return
        }
        importFromFile(content, file.name)
      }

      try {
        reader.readAsText(file)
      } catch {
        setReadError(`'${file.name}' could not be read.`)
      }
    },
    [importFromFile]
  )

  const openPicker = (source: ImportSource) => {
    setPendingSource(source)
    // Let the accept attribute update before the dialog opens.
    requestAnimationFrame(() => fileInputRef.current?.click())
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) {
      setReadError('No file was dropped. Drop a single .xml or .xti file.')
      return
    }
    if (files.length > 1) {
      setReadError(`${files.length} files were dropped. Drop a single .xml or .xti file.`)
      return
    }
    handleFile(files[0])
  }

  const isLoaded = !!softDriveParams

  return (
    <div className="import-step">
      <div className="import-options">
        {(Object.keys(SOURCE_LABELS) as ImportSource[]).map((source) => {
          const { title, hint } = SOURCE_LABELS[source]
          const Icon = source === 'parameterSet' ? FileIcon : FileXtiIcon
          return (
            <div key={source} className="import-option">
              <button type="button" className="import-option-btn" onClick={() => openPicker(source)}>
                <Icon size={16} className="import-option-icon" />
                <span className="import-option-text">
                  <span className="import-option-title">{title}</span>
                  <span className="import-option-hint">{hint}</span>
                </span>
              </button>
              <HelpButton guideId={source === 'parameterSet' ? 'exportParameterSet' : 'saveMoverAxisXti'} />
            </div>
          )
        })}

        <div className="import-option">
          <button type="button" className="import-option-btn" onClick={loadDefaults}>
            <SlidersIcon size={16} className="import-option-icon" />
            <span className="import-option-text">
              <span className="import-option-title">Load Defaults</span>
              <span className="import-option-hint">Start from typical SoftDrive values</span>
            </span>
          </button>
        </div>
      </div>

      <div
        className={`import-dropzone ${isDragging ? 'is-dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => openPicker(pendingSource)}
      >
        <UploadIcon size={18} />
        <span>Drop an .xml or .xti file here</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={`${SOURCE_LABELS[pendingSource].accept},.xml,.xti`}
        className="import-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {readError && (
        <div className="import-messages">
          <div className="import-message import-message-error">
            <AlertIcon size={14} />
            <span>{readError}</span>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="import-messages">
          {validationErrors.map((err, i) => (
            <div key={i} className="import-message import-message-error">
              <AlertIcon size={14} />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div className="import-messages">
          {validationWarnings.map((warn, i) => (
            <div key={i} className="import-message import-message-warning">
              <WarningIcon size={14} />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {isLoaded && (
        <div className="import-summary">
          <p className="import-summary-line">
            <strong>{sourceFileName ?? 'Default parameters'}</strong>
            {sourceFormat && <span className="import-summary-format">{FORMAT_LABELS[sourceFormat]}</span>}
          </p>
          <p className="import-summary-meta">
            {controlAreas.length > 0
              ? `${controlAreas.length} enabled control area${controlAreas.length === 1 ? '' : 's'}`
              : 'No enabled control areas'}
          </p>
          <Button variant="ghost" size="sm" onClick={resetParameters}>
            <ResetIcon size={14} />
            Reset
          </Button>
        </div>
      )}
    </div>
  )
}
