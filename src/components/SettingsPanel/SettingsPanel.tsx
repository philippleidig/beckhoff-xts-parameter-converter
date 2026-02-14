import { useCallback, useRef } from 'react'
import { useParameterStore } from '@/stores/parameterStore'
import { MOVER_TYPES } from '@/lib/constants/moverTypes'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { UploadIcon, ResetIcon, AlertIcon, WarningIcon } from '@/components/ui/Icons'
import './SettingsPanel.css'

const moverTypeOptions = Object.values(MOVER_TYPES).map((mt) => ({
  value: mt.id,
  label: `${mt.name} (FF: ${mt.forceFactor})`,
}))

export function SettingsPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    selectedMoverType,
    validationErrors,
    validationWarnings,
    setMoverType,
    importFromXml,
    loadDefaults,
    resetParameters,
  } = useParameterStore()

  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        importFromXml(content)
      }
      reader.readAsText(file)
    },
    [importFromXml]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith('.xml')) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="settings-panel">
      <Card title="Mover Type">
        <Select
          options={moverTypeOptions}
          value={selectedMoverType ?? ''}
          onChange={(e) => setMoverType(e.target.value)}
          placeholder="Select mover type..."
        />
      </Card>

      <Card title="Import Parameters">
        <div
          className="upload-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon size={24} className="upload-icon" />
          <span className="upload-text">
            Drop XML file here or click to browse
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            className="upload-input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
              e.target.value = ''
            }}
          />
        </div>

        {validationErrors.length > 0 && (
          <div className="validation-errors">
            {validationErrors.map((err, i) => (
              <div key={i} className="validation-error">
                <AlertIcon size={14} />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className="validation-warnings">
            {validationWarnings.map((warn, i) => (
              <div key={i} className="validation-warning">
                <WarningIcon size={14} />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        <div className="settings-actions">
          <Button variant="secondary" size="sm" onClick={loadDefaults}>
            Load Defaults
          </Button>
          <Button variant="ghost" size="sm" onClick={resetParameters}>
            <ResetIcon size={14} />
            Reset
          </Button>
        </div>
      </Card>
    </div>
  )
}
