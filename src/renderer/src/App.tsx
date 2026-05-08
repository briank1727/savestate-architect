import { useState } from 'react'
import Profiles from './tabs/Profiles'
import ascendantsGrip from './assets/ascendants_grip.png'

type Tab = 'Home' | 'Profiles' | 'Settings'

const TABS: Tab[] = ['Home', 'Profiles', 'Settings']

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('Home')

  return (
    <div className="flex flex-col w-full h-full">
      <header className="flex items-center gap-3 px-6 pt-5 pb-3">
        <img
          className="w-10 h-10 object-contain [-webkit-user-drag:none]"
          src={ascendantsGrip}
          alt=""
        />
        <h1 className="m-0 text-[22px] font-bold text-[var(--ev-c-text-1)]">
          Savestate Architect
        </h1>
      </header>
      <nav
        className="flex gap-1 px-6 border-b border-[var(--ev-c-gray-1)]"
        role="tablist"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              className={
                'appearance-none bg-transparent border-0 cursor-pointer text-sm font-semibold px-4 py-2.5 border-b-2 -mb-px transition-[color,border-color] duration-150 ease-in-out hover:text-[var(--ev-c-text-1)] ' +
                (isActive
                  ? 'text-[var(--ev-c-text-1)] border-[var(--ev-c-text-1)]'
                  : 'text-[var(--ev-c-text-2)] border-transparent')
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          )
        })}
      </nav>
      <main className="flex-1 p-6 overflow-auto" role="tabpanel" aria-label={activeTab}>
        <div hidden={activeTab !== 'Profiles'}>
          <Profiles />
        </div>
      </main>
    </div>
  )
}

export default App
