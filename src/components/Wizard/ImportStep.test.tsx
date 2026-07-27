import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ImportStep } from './ImportStep'
import { useParameterStore } from '@/stores/parameterStore'

function sample(name: string): string {
  return readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
}

/** Builds a File, optionally reporting a size larger than its actual contents. */
function makeFile(name: string, content: string, size?: number): File {
  const file = new File([content], name, { type: 'text/xml' })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type=file]')
  if (!input) throw new Error('file input not rendered')
  return input as HTMLInputElement
}

function selectFile(file: File) {
  fireEvent.change(fileInput(), { target: { files: [file] } })
}

function dropFiles(files: File[]) {
  const zone = document.querySelector('.import-dropzone')!
  fireEvent.drop(zone, { dataTransfer: { files } })
}

describe('ImportStep', () => {
  beforeEach(() => {
    useParameterStore.getState().resetParameters()
  })

  it('accepts a valid parameter set and reports the detected format', async () => {
    render(<ImportStep />)
    selectFile(makeFile('ParameterSet.xml', sample('ParameterSet.xml')))

    await waitFor(() => expect(screen.getByText('Parameter Set (XML)')).toBeInTheDocument())
    expect(useParameterStore.getState().softDriveParams).not.toBeNull()
    expect(document.querySelectorAll('.import-message-error')).toHaveLength(0)
  })

  it('accepts a Mover Axis XTI', async () => {
    render(<ImportStep />)
    selectFile(makeFile('Mover_Axis_1.xti', sample('Mover_Axis_1.xti')))

    await waitFor(() => expect(screen.getByText('Mover Axis (XTI)')).toBeInTheDocument())
  })

  describe('rejects files that cannot be a parameter export', () => {
    it('rejects a wrong file extension without reading it', async () => {
      render(<ImportStep />)
      selectFile(makeFile('notes.txt', sample('ParameterSet.xml')))

      await waitFor(() => expect(screen.getByText(/is not an \.xml or \.xti file/)).toBeInTheDocument())
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })

    it('rejects an empty file', async () => {
      render(<ImportStep />)
      selectFile(makeFile('empty.xml', ''))

      await waitFor(() => expect(screen.getByText(/is empty/)).toBeInTheDocument())
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })

    it('rejects a file beyond the size limit and states both sizes', async () => {
      render(<ImportStep />)
      selectFile(makeFile('huge.xml', '<x/>', 64 * 1024 * 1024))

      await waitFor(() => expect(screen.getByText(/larger than the/)).toBeInTheDocument())
      expect(screen.getByText(/64\.0 MB/)).toBeInTheDocument()
      expect(screen.getByText(/32\.0 MB/)).toBeInTheDocument()
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })

    it('accepts a file just under the size limit', async () => {
      render(<ImportStep />)
      selectFile(makeFile('ok.xml', sample('ParameterSet.xml'), 32 * 1024 * 1024))

      await waitFor(() => expect(screen.getByText('Parameter Set (XML)')).toBeInTheDocument())
    })
  })

  describe('drag and drop', () => {
    it('reports a multi-file drop instead of silently using the first', async () => {
      render(<ImportStep />)
      dropFiles([makeFile('a.xml', sample('ParameterSet.xml')), makeFile('b.xml', sample('ParameterSet.xml'))])

      await waitFor(() => expect(screen.getByText(/2 files were dropped/)).toBeInTheDocument())
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })

    it('reports an empty drop', async () => {
      render(<ImportStep />)
      dropFiles([])

      await waitFor(() => expect(screen.getByText(/No file was dropped/)).toBeInTheDocument())
    })

    it('accepts a single dropped file', async () => {
      render(<ImportStep />)
      dropFiles([makeFile('ParameterSet.xml', sample('ParameterSet.xml'))])

      await waitFor(() => expect(screen.getByText('Parameter Set (XML)')).toBeInTheDocument())
    })
  })

  describe('validation feedback', () => {
    it('surfaces the parameter that could not be read as a number', async () => {
      const broken = sample('ParameterSet.xml').replace(
        /(<Name>Kp<\/Name>\s*<Value>)0\.07(<\/Value>)/,
        '$10,07$2'
      )
      render(<ImportStep />)
      selectFile(makeFile('comma.xml', broken))

      await waitFor(() =>
        expect(screen.getByText(/VelocityControl\.Kp is not a readable number/)).toBeInTheDocument()
      )
      expect(useParameterStore.getState().softDriveParams).toBeNull()
    })

    it('reports an unusable root element', async () => {
      render(<ImportStep />)
      selectFile(makeFile('page.xml', '<html><body>hi</body></html>'))

      await waitFor(() => expect(screen.getByText(/Expected root element/)).toBeInTheDocument())
    })

    it('clears a previous read error on the next successful import', async () => {
      render(<ImportStep />)
      selectFile(makeFile('notes.txt', 'x'))
      await waitFor(() => expect(screen.getByText(/is not an \.xml or \.xti file/)).toBeInTheDocument())

      selectFile(makeFile('ParameterSet.xml', sample('ParameterSet.xml')))
      await waitFor(() => expect(screen.queryByText(/is not an \.xml or \.xti file/)).not.toBeInTheDocument())
    })
  })

  it('reports the number of enabled control areas', async () => {
    render(<ImportStep />)
    selectFile(makeFile('ParameterSet.xml', sample('ParameterSet.xml')))

    await waitFor(() => expect(screen.getByText('No enabled control areas')).toBeInTheDocument())
  })

  it('loads defaults without touching the file input', () => {
    render(<ImportStep />)
    fireEvent.click(screen.getByText('Load Defaults'))

    expect(useParameterStore.getState().softDriveParams).not.toBeNull()
    expect(useParameterStore.getState().sourceFormat).toBeNull()
  })
})
