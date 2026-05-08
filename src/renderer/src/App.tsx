import { useState } from 'react'
import Profiles from './tabs/Profiles'
import ascendantsGrip from './assets/ascendants_grip.png'

type Tab = 'Home' | 'Profiles' | 'Settings'

const TABS: Tab[] = ['Home', 'Profiles', 'Settings']

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('Home')

  return (
    <div className="app">
      <header className="app-header">
        <img className="app-logo" src={ascendantsGrip} alt="" />
        <h1 className="app-title">Savestate Architect</h1>
      </header>
      <nav className="app-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`app-tab${activeTab === tab ? ' app-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <main className="app-tab-panel" role="tabpanel" aria-label={activeTab}>
        {activeTab === 'Profiles' && <Profiles />}
      </main>
    </div>
  )
}

export default App
