import { GithubIcon, FeedbackIcon } from '@/components/ui/Icons'
import { VersionSelector } from './VersionSelector'
import './Header.css'

const APP_VERSION = 'V1.4'

export function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <span className="header-mark" aria-hidden="true" />
        <h1 className="header-title">
          XTS <strong>Parameter Converter</strong>
        </h1>
        <span className="header-subtitle">SoftDrive to MoverController</span>
        <span className="header-version">{APP_VERSION}</span>
      </div>
      <div className="header-right">
        <VersionSelector />
        <a
          href="https://github.com/philippleidig/beckhoff-xts-parameter-converter/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="header-link"
        >
          <FeedbackIcon size={18} />
          <span>Feedback</span>
        </a>
        <a
          href="https://github.com/philippleidig/beckhoff-xts-parameter-converter"
          target="_blank"
          rel="noopener noreferrer"
          className="header-link"
        >
          <GithubIcon size={18} />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  )
}
