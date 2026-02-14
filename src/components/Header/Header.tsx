import { GithubIcon, FeedbackIcon, DownloadIcon } from '@/components/ui/Icons'
import './Header.css'

const APP_VERSION = 'V1.2'

interface HeaderProps {
  onDownload?: () => void
  canDownload?: boolean
}

export function Header({ onDownload, canDownload }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">XTS Parameter Converter</h1>
        <span className="header-subtitle">SoftDrive to MoverController</span>
        <span className="header-version">{APP_VERSION}</span>
      </div>
      <div className="header-right">
        <button
          className="header-download-btn"
          onClick={onDownload}
          disabled={!canDownload}
          title={canDownload ? 'Download as XTI file' : 'Import parameters and select a mover type first'}
        >
          <DownloadIcon size={18} />
          Export XTI
        </button>
        <a
          href="https://github.com/philippleidig/beckhoff-xts-parameter-converter/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="header-link"
        >
          <FeedbackIcon size={18} />
          Feedback
        </a>
        <a
          href="https://github.com/philippleidig/beckhoff-xts-parameter-converter"
          target="_blank"
          rel="noopener noreferrer"
          className="header-link"
        >
          <GithubIcon size={18} />
          GitHub
        </a>
      </div>
    </header>
  )
}
