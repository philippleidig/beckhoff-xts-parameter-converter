import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CompareView } from './CompareView'
import { useCompareStore } from '@/stores/compareStore'

function sample(name: string): string {
  return readFileSync(resolve(__dirname, '../../../samples', name), 'utf-8')
}

function makeFile(name: string): File {
  return new File([sample(name)], name, { type: 'text/xml' })
}

/** The two slots render identical inputs, so they are addressed by position. */
function dropInto(side: 'left' | 'right', file: File) {
  const zones = document.querySelectorAll('.compare-dropzone')
  fireEvent.drop(zones[side === 'left' ? 0 : zones.length - 1], { dataTransfer: { files: [file] } })
}

function defaultsButton(label: RegExp) {
  return screen.getAllByRole('button', { name: label })
}

describe('CompareView', () => {
  beforeEach(() => {
    useCompareStore.getState().reset()
  })

  it('asks for both sides before showing a comparison', () => {
    render(<CompareView onBack={() => {}} />)
    expect(screen.getByText(/Load a parameter set on both sides/)).toBeInTheDocument()
  })

  it('compares two SoftDrive parameter sets', async () => {
    render(<CompareView onBack={() => {}} />)

    dropInto('left', makeFile('ParameterSet.xml'))
    await waitFor(() => expect(useCompareStore.getState().left).not.toBeNull())
    dropInto('right', makeFile('ParameterSet_Old.xml'))

    await waitFor(() => expect(screen.getByText(/parameters differ/)).toBeInTheDocument())
    // Each file names its slot and the column it fills in every module's table.
    expect(screen.getAllByText('ParameterSet.xml').length).toBeGreaterThan(1)
    expect(screen.getAllByText('ParameterSet_Old.xml').length).toBeGreaterThan(1)
  })

  it('compares a MoverController set against the default values', async () => {
    render(<CompareView onBack={() => {}} />)

    dropInto('left', makeFile('MoverControllerDefaultParameterSet.xti'))
    await waitFor(() => expect(useCompareStore.getState().left).not.toBeNull())

    // Once a generation is pinned, only its defaults are offered.
    fireEvent.click(defaultsButton(/Use default values/)[0])

    await waitFor(() =>
      expect(screen.getByText(/all \d+ parameters match/)).toBeInTheDocument()
    )
  })

  it('offers the defaults of both generations while nothing is loaded', () => {
    render(<CompareView onBack={() => {}} />)
    expect(defaultsButton(/SoftDrive \(old\) defaults/)).toHaveLength(2)
    expect(defaultsButton(/MoverController \(new\) defaults/)).toHaveLength(2)
  })

  it('refuses an old set against a new set', async () => {
    render(<CompareView onBack={() => {}} />)

    dropInto('left', makeFile('ParameterSet.xml'))
    await waitFor(() => expect(useCompareStore.getState().left).not.toBeNull())
    dropInto('right', makeFile('MoverControllerDefaultParameterSet.xti'))

    await waitFor(() =>
      expect(screen.getByText(/Compare old sets with old sets and new with new/)).toBeInTheDocument()
    )
    expect(useCompareStore.getState().right).toBeNull()
  })

  it('hides identical parameters until asked for them', async () => {
    render(<CompareView onBack={() => {}} />)

    fireEvent.click(defaultsButton(/MoverController \(new\) defaults/)[0])
    fireEvent.click(defaultsButton(/Use default values/)[0])

    await waitFor(() => expect(screen.getByText(/all \d+ parameters match/)).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('Show identical parameters'))
    expect(screen.getByText('Max Velocity')).toBeInTheDocument()
  })

  it('reports a file that holds neither generation', async () => {
    render(<CompareView onBack={() => {}} />)
    fireEvent.drop(document.querySelector('.compare-dropzone')!, {
      dataTransfer: { files: [new File(['<html></html>'], 'page.xml', { type: 'text/xml' })] },
    })

    await waitFor(() =>
      expect(
        screen.getByText(/contains neither a SoftDrive nor a MoverController parameter set/)
      ).toBeInTheDocument()
    )
  })

  it('clears both sides', async () => {
    render(<CompareView onBack={() => {}} />)

    fireEvent.click(defaultsButton(/SoftDrive \(old\) defaults/)[0])
    await waitFor(() => expect(useCompareStore.getState().left).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: /Clear both/ }))
    expect(useCompareStore.getState().left).toBeNull()
    expect(useCompareStore.getState().right).toBeNull()
  })
})
