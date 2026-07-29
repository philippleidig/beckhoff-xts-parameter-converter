import { useCallback, useRef, useState } from 'react'
import { useCompareStore } from '@/stores/compareStore'
import type { CompareSide } from '@/stores/compareStore'
import type { ParameterSetKind } from '@/lib/xml/detectFormat'
import { readParameterFile, singleDroppedFile } from '@/lib/files/readParameterFile'
import { Button } from '@/components/ui/Button'
import { AlertIcon, SlidersIcon, UploadIcon } from '@/components/ui/Icons'

const KIND_BADGES: Record<ParameterSetKind, string> = {
  softDrive: 'SoftDrive (old)',
  moverController: 'MoverController (new)',
}

interface CompareSlotCardProps {
  side: CompareSide
  title: string
  /** The generation the other side pinned, if any — defaults must match it. */
  activeKind: ParameterSetKind | null
}

export function CompareSlotCard({ side, title, activeKind }: CompareSlotCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)

  const slot = useCompareStore((state) => state[side])
  const errors = useCompareStore((state) => state.errors[side])
  const { loadFile, loadDefaults, clear } = useCompareStore()

  const handleFile = useCallback(
    (file: File) => {
      setReadError(null)
      readParameterFile(file).then(
        (content) => loadFile(side, content, file.name),
        (err: Error) => setReadError(err.message)
      )
    },
    [loadFile, side]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const dropped = singleDroppedFile(Array.from(e.dataTransfer.files))
    if ('error' in dropped) {
      setReadError(dropped.error)
      return
    }
    handleFile(dropped.file)
  }

  const defaultKinds: ParameterSetKind[] = activeKind
    ? [activeKind]
    : ['softDrive', 'moverController']

  const messages = [...(readError ? [readError] : []), ...errors]

  return (
    <section className="compare-slot">
      <header className="compare-slot-header">
        <h3 className="compare-slot-title">{title}</h3>
        {slot && <span className="compare-slot-badge">{KIND_BADGES[slot.kind]}</span>}
      </header>

      {slot ? (
        <div className="compare-slot-loaded">
          <p className="compare-slot-label">{slot.label}</p>
          <Button variant="ghost" size="sm" onClick={() => clear(side)}>
            Clear
          </Button>
        </div>
      ) : (
        <>
          <div
            className={`compare-dropzone ${isDragging ? 'is-dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon size={18} />
            <span>Drop an .xml or .xti file here, or click to choose one</span>
          </div>

          <div className="compare-slot-defaults">
            {defaultKinds.map((kind) => (
              <Button
                key={kind}
                variant="secondary"
                size="sm"
                onClick={() => loadDefaults(side, kind)}
              >
                <SlidersIcon size={14} />
                {activeKind ? 'Use default values' : `${KIND_BADGES[kind]} defaults`}
              </Button>
            ))}
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.xti"
        className="compare-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {messages.length > 0 && (
        <div className="compare-slot-messages">
          {messages.map((message, i) => (
            <p key={i} className="compare-slot-error">
              <AlertIcon size={14} />
              <span>{message}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
