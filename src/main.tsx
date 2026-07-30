import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { restoreSelectedTmcVersion } from './stores/tmcVersionStore'
import './index.css'

// Fire and forget: the app renders against the default driver version and swaps to the
// stored one when its chunk arrives, rather than holding up the first paint for it.
void restoreSelectedTmcVersion()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
