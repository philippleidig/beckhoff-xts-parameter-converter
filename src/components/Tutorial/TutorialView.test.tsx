import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { TutorialView } from './TutorialView'
import { TUTORIAL_GROUPS, TUTORIAL_STEPS } from '@/lib/tutorial/steps'
import { useTutorialStore } from '@/stores/tutorialStore'

function tree() {
  return screen.getByRole('navigation', { name: 'Migration steps' })
}

function openStep(name: RegExp) {
  fireEvent.click(within(tree()).getByRole('button', { name }))
}

describe('TutorialView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTutorialStore.getState().reset()
  })

  it('lists every group and step in the tree', () => {
    render(<TutorialView onBack={() => {}} />)

    for (const group of TUTORIAL_GROUPS) {
      expect(within(tree()).getByText(group.title)).toBeInTheDocument()
    }
    expect(within(tree()).getAllByRole('button')).toHaveLength(TUTORIAL_STEPS.length)
  })

  it('starts on the overview', () => {
    render(<TutorialView onBack={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Overview and prerequisites' })).toBeInTheDocument()
    expect(within(tree()).getByRole('button', { current: 'step' })).toHaveTextContent(
      'Overview and prerequisites'
    )
  })

  it('shows the selected step', () => {
    render(<TutorialView onBack={() => {}} />)
    openStep(/Delete the mover and axis objects/)

    expect(
      screen.getByRole('heading', { name: 'Delete the mover and axis objects' })
    ).toBeInTheDocument()
    expect(screen.getByText('Step 4 of 10')).toBeInTheDocument()
  })

  it('marks a step done and moves to the next one', () => {
    render(<TutorialView onBack={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Mark done and continue/ }))

    expect(useTutorialStore.getState().completed).toEqual(['overview'])
    expect(
      screen.getByRole('heading', { name: 'Export the NC axis parameters' })
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 11 steps done')).toBeInTheDocument()
  })

  it('goes back to the previous step', () => {
    render(<TutorialView onBack={() => {}} />)
    openStep(/Convert to a MoverController parameter set/)
    fireEvent.click(screen.getByRole('button', { name: /Back/ }))

    expect(
      screen.getByRole('heading', { name: 'Export the SoftDrive parameter set' })
    ).toBeInTheDocument()
  })

  it('lets an optional step be skipped without marking it done', () => {
    render(<TutorialView onBack={() => {}} />)
    openStep(/Export the NC axis parameters/)
    fireEvent.click(screen.getByRole('button', { name: 'Skip this step' }))

    expect(useTutorialStore.getState().completed).toEqual([])
    expect(
      screen.getByRole('heading', { name: 'Export the SoftDrive parameter set' })
    ).toBeInTheDocument()
  })

  it('opens Convert in a second tab so the reader keeps their place', () => {
    render(<TutorialView onBack={() => {}} />)
    openStep(/Convert to a MoverController parameter set/)

    const link = screen.getByRole('link', { name: /Open Convert in a new tab/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('href')).toMatch(/#\/convert$/)
  })

  // Content is plain data with inline markup; an unbalanced `**` or backtick would
  // otherwise silently reach the reader as a literal asterisk.
  it('renders the inline markup of every step instead of printing it', () => {
    const { unmount } = render(<TutorialView onBack={() => {}} />)

    for (const step of TUTORIAL_STEPS) {
      unmount()
      useTutorialStore.setState({ activeStepId: step.id })
      render(<TutorialView onBack={() => {}} />)

      const panel = document.querySelector('.tutorial-step') as HTMLElement
      expect(panel.textContent).not.toMatch(/[*`]/)
    }
  })

  it('resets the progress', () => {
    render(<TutorialView onBack={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Mark done and continue/ }))
    fireEvent.click(screen.getByRole('button', { name: /Reset progress/ }))

    expect(useTutorialStore.getState().completed).toEqual([])
    expect(screen.getByRole('heading', { name: 'Overview and prerequisites' })).toBeInTheDocument()
  })

  // Losing the position on reload would be painful: a migration spans several sittings.
  it('restores the progress from localStorage', () => {
    const { unmount } = render(<TutorialView onBack={() => {}} />)
    openStep(/Finish the configurator/)
    unmount()

    // Re-create the store from what was persisted, like a fresh page load would.
    useTutorialStore.setState(
      JSON.parse(window.localStorage.getItem('xts-tutorial-progress') ?? '{}')
    )
    render(<TutorialView onBack={() => {}} />)

    expect(
      screen.getByRole('heading', { name: 'Finish the configurator and check the result' })
    ).toBeInTheDocument()
  })
})
