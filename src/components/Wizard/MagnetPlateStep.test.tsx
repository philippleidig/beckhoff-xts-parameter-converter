import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MagnetPlateStep } from './MagnetPlateStep'
import { useParameterStore } from '@/stores/parameterStore'

function sample(name: string): string {
  return readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
}

function plateSelect() {
  return screen.getByLabelText('Magnet plate set') as HTMLSelectElement
}

describe('MagnetPlateStep', () => {
  beforeEach(() => {
    useParameterStore.getState().resetParameters()
  })

  it('starts with no plate selected', () => {
    render(<MagnetPlateStep />)
    expect(plateSelect().value).toBe('')
    expect(screen.queryByText('Detected from source')).not.toBeInTheDocument()
  })

  it('shows the force factor of the chosen plate', () => {
    render(<MagnetPlateStep />)
    fireEvent.change(plateSelect(), { target: { value: 'AT9001_0550' } })

    expect(screen.getByText('AT9001-0550')).toBeInTheDocument()
    expect(screen.getByText('7.7')).toBeInTheDocument()
  })

  describe('detection from the source file', () => {
    it('preselects the plate and shows the value it was derived from', () => {
      // Mover_Axis_1.xti carries SoftDriveMotorPara.TorqueConstant = 7.7.
      useParameterStore.getState().importFromFile(sample('Mover_Axis_1.xti'), 'Mover_Axis_1.xti')
      render(<MagnetPlateStep />)

      expect(plateSelect().value).toBe('AT9001_0550')
      expect(screen.getByText('Detected from source')).toBeInTheDocument()
      expect(screen.getByText(/Motor torque constant 7\.7 matches this plate/)).toBeInTheDocument()
    })

    it('stays silent when the torque constant matches no plate', () => {
      // ParameterSet.xml carries 8, which is not a known force factor.
      useParameterStore.getState().importFromFile(sample('ParameterSet.xml'), 'ParameterSet.xml')
      render(<MagnetPlateStep />)

      expect(plateSelect().value).toBe('')
      expect(screen.queryByText('Detected from source')).not.toBeInTheDocument()
    })

    it('drops the badge once the user overrides the suggestion', () => {
      useParameterStore.getState().importFromFile(sample('Mover_Axis_1.xti'), 'Mover_Axis_1.xti')
      render(<MagnetPlateStep />)
      expect(screen.getByText('Detected from source')).toBeInTheDocument()

      fireEvent.change(plateSelect(), { target: { value: 'AT9001_0AA0' } })

      expect(screen.queryByText('Detected from source')).not.toBeInTheDocument()
      expect(screen.getByText('AT9001-0AA0')).toBeInTheDocument()
    })

    it('never overrides a plate the user picked before importing', () => {
      useParameterStore.getState().setMagnetPlateType('AT9001_0775')
      useParameterStore.getState().importFromFile(sample('Mover_Axis_1.xti'), 'Mover_Axis_1.xti')
      render(<MagnetPlateStep />)

      expect(plateSelect().value).toBe('AT9001_0775')
      expect(screen.queryByText('Detected from source')).not.toBeInTheDocument()
    })
  })
})
