import { Header } from '@/components/Header/Header'
import { Home } from '@/components/Home/Home'
import { CompareView } from '@/components/Compare/CompareView'
import { CreateView } from '@/components/Create/CreateView'
import { ViewHeader } from '@/components/Layout/ViewHeader'
import { Wizard } from '@/components/Wizard/Wizard'
import { useHashView } from '@/lib/navigation/useHashView'
import './App.css'

export default function App() {
  const [view, navigate] = useHashView()
  const goHome = () => navigate('home')

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        {view === 'home' && <Home onNavigate={navigate} />}

        {view === 'convert' && (
          <>
            <ViewHeader
              title="Convert a SoftDrive parameter set"
              description="Import the existing parameters, choose the magnet plate set and export the converted MoverController parameter set."
              onBack={goHome}
            />
            <Wizard />
          </>
        )}

        {view === 'compare' && <CompareView onBack={goHome} />}
        {view === 'create' && <CreateView onBack={goHome} />}
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
