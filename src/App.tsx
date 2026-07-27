import { Header } from '@/components/Header/Header'
import { Wizard } from '@/components/Wizard/Wizard'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Wizard />
      </main>
      <footer className="app-disclaimer">
        This project is an independent, community-driven tool. It is <strong>not affiliated with, endorsed by, supported by, or maintained by Beckhoff Automation GmbH &amp; Co. KG</strong> in any way.
        This is <strong>not a Beckhoff product</strong>. "Beckhoff", "XTS", "TwinCAT", and related names are trademarks of Beckhoff Automation.
        All converted parameter values should be thoroughly reviewed and validated before being used in any production environment.
        The authors assume no liability for any damages or losses resulting from the use of this tool. Use at your own risk.
      </footer>
    </div>
  )
}
