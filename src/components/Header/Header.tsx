import { GithubIcon } from '@/components/ui/Icons'
import './Header.css'

export function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">XTS Parameter Converter</h1>
        <span className="header-subtitle">SoftDrive to MoverController</span>
      </div>
      <div className="header-right">
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
