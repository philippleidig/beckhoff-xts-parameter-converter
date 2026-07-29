import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CreateView } from './CreateView'
import { useCreateStore } from '@/stores/createStore'
import { createDefaultMoverControllerParameters } from '@/lib/converter/defaults'
import * as generateXtiModule from '@/lib/xti/generateXti'

function sample(name: string): string {
  return readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
}

function downloadButton() {
  return screen.getByRole('button', { name: /Download parameter set/ })
}

/** The editable tree renders one input per parameter, labelled by its display name. */
function inputFor(label: string): HTMLInputElement {
  const row = screen.getByText(label).closest('.tree-param')
  if (!row) throw new Error(`no row for ${label}`)
  const input = row.querySelector('input, select')
  if (!input) throw new Error(`no editor for ${label}`)
  return input as HTMLInputElement
}

function selectFile(file: File) {
  fireEvent.change(document.querySelector('.create-file-input') as HTMLInputElement, {
    target: { files: [file] },
  })
}

describe('CreateView', () => {
  beforeEach(() => {
    useCreateStore.getState().reset()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts from the TwinCAT default values', () => {
    render(<CreateView onBack={() => {}} />)
    expect(screen.getByText('TwinCAT defaults')).toBeInTheDocument()
    expect(inputFor('Max Velocity').value).toBe('4200')
  })

  it('exports the edited values, not the defaults', () => {
    const spy = vi.spyOn(generateXtiModule, 'downloadXti').mockImplementation(() => {})
    render(<CreateView onBack={() => {}} />)

    fireEvent.change(inputFor('Max Velocity'), { target: { value: '3000' } })
    fireEvent.click(downloadButton())

    const exported = spy.mock.calls[0][0]
    expect(exported.velocityControl.MaxVelocity).toBe(3000)
    expect(spy.mock.calls[0][1]).toBe('MoverControllerParameterSet.xti')
  })

  it('exports under the file name the user chose', () => {
    const spy = vi.spyOn(generateXtiModule, 'downloadXti').mockImplementation(() => {})
    render(<CreateView onBack={() => {}} />)

    fireEvent.change(screen.getByLabelText(/File name/), { target: { value: 'Mover_7.xti' } })
    fireEvent.click(downloadButton())

    expect(spy.mock.calls[0][1]).toBe('Mover_7.xti')
  })

  it('restores the defaults after an edit', () => {
    render(<CreateView onBack={() => {}} />)

    fireEvent.change(inputFor('Max Velocity'), { target: { value: '3000' } })
    fireEvent.click(screen.getByRole('button', { name: /Reset to defaults/ }))

    expect(useCreateStore.getState().params).toEqual(createDefaultMoverControllerParameters())
    expect(inputFor('Max Velocity').value).toBe('4200')
  })

  it('can start from an existing parameter set', async () => {
    render(<CreateView onBack={() => {}} />)
    selectFile(
      new File([sample('MoverControllerDefaultParameterSet.xti')], 'Existing.xti', {
        type: 'text/xml',
      })
    )

    await waitFor(() => expect(screen.getByText('from Existing.xti')).toBeInTheDocument())
    expect(useCreateStore.getState().params).toEqual(createDefaultMoverControllerParameters())
  })

  it('refuses a SoftDrive file, which holds different parameters', async () => {
    render(<CreateView onBack={() => {}} />)
    selectFile(new File([sample('Mover_Axis_1.xti')], 'Mover_Axis_1.xti', { type: 'text/xml' }))

    await waitFor(() =>
      expect(screen.getByText(/No MoverController parameters found/)).toBeInTheDocument()
    )
    expect(useCreateStore.getState().sourceFileName).toBeNull()
  })

  it('surfaces a generator failure instead of failing silently', () => {
    vi.spyOn(generateXtiModule, 'downloadXti').mockImplementation(() => {
      throw new Error('Cannot export: the converted value is Infinity.')
    })
    render(<CreateView onBack={() => {}} />)

    fireEvent.click(downloadButton())
    expect(screen.getByText(/the converted value is Infinity/)).toBeInTheDocument()
  })
})
