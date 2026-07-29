import { useCallback, useEffect, useState } from 'react'

export const VIEWS = ['home', 'compare', 'convert', 'create'] as const

export type View = (typeof VIEWS)[number]

function isView(value: string): value is View {
  return (VIEWS as readonly string[]).includes(value)
}

function viewFromHash(): View {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return isView(hash) ? hash : 'home'
}

/**
 * Keeps the active view in the URL hash.
 *
 * The app is served as a static site, so a hash is the only routing that survives a
 * reload without server support — and it makes the browser's Back button step between
 * the start page and a tool instead of leaving the app.
 */
export function useHashView(): [View, (view: View) => void] {
  const [view, setView] = useState<View>(viewFromHash)

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((next: View) => {
    // The hashchange listener applies the new view; assigning the hash keeps the
    // history entry so Back returns to the previous view.
    window.location.hash = next === 'home' ? '' : `/${next}`
    setView(next)
  }, [])

  return [view, navigate]
}
