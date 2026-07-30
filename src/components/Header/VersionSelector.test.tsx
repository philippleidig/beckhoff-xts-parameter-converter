import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VersionSelector } from './VersionSelector'
import { useTmcVersionStore } from '@/stores/tmcVersionStore'
import { DEFAULT_TMC_VERSION, TMC_VERSIONS } from '@/lib/tmc/registry'

describe('VersionSelector', () => {
  beforeEach(() => {
    useTmcVersionStore.setState({ version: DEFAULT_TMC_VERSION, loading: false, error: null })
  })

  /**
   * Until the feed sync has run, the store holds the single version that was committed
   * with the repository. A dropdown with one entry invites a choice that does not
   * exist, so the control renders as a label instead.
   */
  it('renders the version as a label while there is only one', () => {
    render(<VersionSelector />)

    if (TMC_VERSIONS.length <= 1) {
      expect(screen.getByText(`TcIoXts ${DEFAULT_TMC_VERSION}`)).toBeInTheDocument()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    } else {
      expect(screen.getByRole('combobox', { name: 'TcIoXts driver version' })).toBeInTheDocument()
    }
  })

  it('shows the version the rest of the app is working against', () => {
    render(<VersionSelector />)

    expect(screen.getByText(new RegExp(DEFAULT_TMC_VERSION.replace(/\./g, '\\.')))).toBeInTheDocument()
  })
})

describe('useTmcVersionStore', () => {
  beforeEach(() => {
    useTmcVersionStore.setState({ version: DEFAULT_TMC_VERSION, loading: false, error: null })
  })

  it('ignores a selection that is already active', async () => {
    await useTmcVersionStore.getState().select(DEFAULT_TMC_VERSION)

    expect(useTmcVersionStore.getState().loading).toBe(false)
    expect(useTmcVersionStore.getState().error).toBeNull()
  })

  /**
   * A version can disappear between being stored and being selected again — a release
   * is withdrawn, or the store is pruned. Keeping the previous version and saying so
   * is better than leaving the user with metadata that never loaded.
   */
  it('keeps the current version when the requested one cannot be loaded', async () => {
    await useTmcVersionStore.getState().select('9.9.9.9')

    const state = useTmcVersionStore.getState()
    expect(state.version).toBe(DEFAULT_TMC_VERSION)
    expect(state.loading).toBe(false)
    expect(state.error).toMatch(/9\.9\.9\.9 is not available/)
  })

  it('survives a localStorage that refuses to be written', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    await expect(useTmcVersionStore.getState().select('9.9.9.9')).resolves.toBeUndefined()

    setItem.mockRestore()
  })
})
