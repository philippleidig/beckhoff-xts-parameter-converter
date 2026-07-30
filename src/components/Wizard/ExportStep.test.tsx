import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExportStep } from './ExportStep'
import { useParameterStore } from '@/stores/parameterStore'
import { XTS_DRIVER_VERSION } from '@/lib/constants/xtsVersion'
import * as generateXtiModule from '@/lib/xti/generateXti'

function baseButton() {
  return screen.getByRole('button', { name: /Base parameter set/ })
}

function versionInput() {
  return screen.getByLabelText('TcIoXts driver version') as HTMLInputElement
}

/** Puts the store into a state where an export is possible. */
function readyToExport() {
  useParameterStore.getState().loadDefaults()
  useParameterStore.getState().setMagnetPlateType('AT9001_0550')
}

describe('ExportStep', () => {
  beforeEach(() => {
    useParameterStore.getState().resetParameters()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stays disabled until the previous steps are complete', () => {
    render(<ExportStep />)
    expect(screen.getByText(/Complete the previous steps/)).toBeInTheDocument()
  })

  it('offers both sets when the source is area-configured', () => {
    readyToExport() // defaults use PI_VELOCITY_STANDSTILL_AREA and FFT_ON_AREA
    render(<ExportStep />)

    expect(baseButton()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Area parameter set/ })).toBeInTheDocument()
  })

  it('offers only the base set when no area configuration is present', () => {
    readyToExport()
    const store = useParameterStore.getState()
    store.setSoftDriveParam('positionControl', 'PositionLoopType', 'P_POSITION_STANDSTILL')
    store.setSoftDriveParam('velocityControl', 'VelocityLoopType', 'PI_VELOCITY_STANDSTILL')
    store.setSoftDriveParam('feedForward', 'FeedforwardType', 'FFT_ON')
    store.setSoftDriveParam('filter', 'Usage', 'ALWAYS')

    render(<ExportStep />)
    expect(baseButton()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Area parameter set/ })).not.toBeInTheDocument()
  })

  describe('driver version', () => {
    it('shows the version the file is built for', () => {
      readyToExport()
      render(<ExportStep />)
      // Named twice: once as the version being built for, once in the warning that the
      // override rewrites only the number and not the contents.
      expect(screen.getAllByText(XTS_DRIVER_VERSION).length).toBeGreaterThan(0)
      expect(versionInput().value).toBe(XTS_DRIVER_VERSION)
    })

    it('marks the version as overridden once it is typed over', () => {
      readyToExport()
      render(<ExportStep />)

      expect(screen.queryByText('overridden')).not.toBeInTheDocument()
      fireEvent.change(versionInput(), { target: { value: '4.5.1.0' } })
      expect(screen.getByText('overridden')).toBeInTheDocument()
    })

    it('blocks the export while the version is malformed', () => {
      readyToExport()
      render(<ExportStep />)

      fireEvent.change(versionInput(), { target: { value: 'latest' } })
      expect(baseButton()).toBeDisabled()
      expect(screen.getByText(/Expected four numbers/)).toBeInTheDocument()

      fireEvent.change(versionInput(), { target: { value: '4.5.1.0' } })
      expect(baseButton()).toBeEnabled()
    })

    it('blocks the export on an emptied field rather than falling back to the default', () => {
      readyToExport()
      render(<ExportStep />)

      fireEvent.change(versionInput(), { target: { value: '' } })
      expect(baseButton()).toBeDisabled()
    })

    it('passes the overridden version to the generator', () => {
      readyToExport()
      const spy = vi.spyOn(generateXtiModule, 'downloadXti').mockImplementation(() => {})
      render(<ExportStep />)

      fireEvent.change(versionInput(), { target: { value: '4.5.1.0' } })
      fireEvent.click(baseButton())

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        'MoverControllerParameterSet.xti',
        { driverVersion: '4.5.1.0' }
      )
    })

    it('uses distinct file names for the two sets', () => {
      readyToExport()
      const spy = vi.spyOn(generateXtiModule, 'downloadXti').mockImplementation(() => {})
      render(<ExportStep />)

      fireEvent.click(baseButton())
      fireEvent.click(screen.getByRole('button', { name: /Area parameter set/ }))

      expect(spy.mock.calls[0][1]).toBe('MoverControllerParameterSet.xti')
      expect(spy.mock.calls[1][1]).toBe('MoverControllerParameterSet_Area.xti')
    })

    it('restores the selected version', () => {
      readyToExport()
      render(<ExportStep />)

      fireEvent.change(versionInput(), { target: { value: '9.9.9.9' } })
      fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
      expect(versionInput().value).toBe(XTS_DRIVER_VERSION)
      expect(screen.queryByText('overridden')).not.toBeInTheDocument()
    })
  })

  it('surfaces a generator failure instead of failing silently', () => {
    readyToExport()
    vi.spyOn(generateXtiModule, 'downloadXti').mockImplementation(() => {
      throw new Error('Cannot export: the converted value is Infinity.')
    })
    render(<ExportStep />)

    fireEvent.click(baseButton())
    expect(screen.getByText(/the converted value is Infinity/)).toBeInTheDocument()
  })

  it('notes that no control area is enabled yet', () => {
    readyToExport()
    render(<ExportStep />)
    expect(screen.getByText(/no control area is\s+enabled in the file/)).toBeInTheDocument()
  })
})
