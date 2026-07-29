import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { useParameterStore } from '@/stores/parameterStore'
import { useCompareStore } from '@/stores/compareStore'
import { useCreateStore } from '@/stores/createStore'

function openTile(name: RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('App navigation', () => {
  beforeEach(() => {
    window.location.hash = ''
    useParameterStore.getState().resetParameters()
    useCompareStore.getState().reset()
    useCreateStore.getState().reset()
  })

  it('starts on the tile page', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Compare/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Convert/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create/ })).toBeInTheDocument()
  })

  it('opens the conversion wizard behind the Convert tile', () => {
    render(<App />)
    openTile(/Convert/)

    expect(screen.getByText('Import Parameter Set')).toBeInTheDocument()
    expect(screen.getByText('Magnet Plate Set')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Convert a SoftDrive parameter set/ })).toBeInTheDocument()
  })

  it('opens the comparison behind the Compare tile', () => {
    render(<App />)
    openTile(/Compare/)
    expect(screen.getByRole('heading', { name: /Compare parameter sets/ })).toBeInTheDocument()
  })

  it('opens the editor behind the Create tile', () => {
    render(<App />)
    openTile(/Create/)
    expect(
      screen.getByRole('heading', { name: /Create a MoverController parameter set/ })
    ).toBeInTheDocument()
  })

  it('returns to the tiles from a view', () => {
    render(<App />)
    openTile(/Create/)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByRole('button', { name: /Convert/ })).toBeInTheDocument()
  })

  // The hash keeps a view addressable and makes the browser Back button work.
  it('records the view in the URL and restores it on load', () => {
    const { unmount } = render(<App />)
    openTile(/Compare/)
    expect(window.location.hash).toBe('#/compare')

    unmount()
    render(<App />)
    expect(screen.getByRole('heading', { name: /Compare parameter sets/ })).toBeInTheDocument()
  })

  it('falls back to the tiles for an unknown hash', () => {
    window.location.hash = '#/nonsense'
    render(<App />)
    expect(screen.getByRole('button', { name: /Convert/ })).toBeInTheDocument()
  })
})
