import { Profile } from '@renderer/lib/profile'
import Button from '../components/Button'
import ImportSavestates from '../views/ImportSavestates'
import { useState } from 'react'

type View = 'list' | 'import'

function countSavestates(savestates: object[][]): number {
  return savestates.reduce((total, folder) => total + folder.length, 0)
}

function Profiles(): React.JSX.Element {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [view, setView] = useState<View>('list')

  const cellClass = 'px-3.5 py-2.5 text-left border-b border-[var(--ev-c-gray-1)]'
  const headerCellClass =
    cellClass +
    ' bg-[var(--color-background-mute)] text-[var(--ev-c-text-2)] font-semibold text-xs uppercase tracking-[0.04em]'

  if (view === 'import') {
    return <ImportSavestates onBack={() => setView('list')} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-start">
        <Button onClick={() => setView('import')}>+ Add Profile</Button>
      </div>
      <table className="w-full border-collapse bg-[var(--color-background-soft)] border border-[var(--ev-c-gray-1)] rounded-lg overflow-hidden text-sm">
        <thead>
          <tr>
            <th className={headerCellClass}>Name</th>
            <th className={headerCellClass}>Savestates</th>
          </tr>
        </thead>
        <tbody>
          {profiles.length === 0 ? (
            <tr>
              <td className="text-center text-[var(--ev-c-text-2)] italic px-3.5 py-6" colSpan={3}>
                No profiles yet.
              </td>
            </tr>
          ) : (
            profiles.map((profile, idx) => {
              const isLast = idx === profiles.length - 1
              const rowCellClass = isLast
                ? cellClass.replace(' border-b border-[var(--ev-c-gray-1)]', '')
                : cellClass
              return (
                <tr key={profile.name} className="hover:bg-[var(--color-background-mute)]">
                  <td className={rowCellClass}>{profile.name}</td>
                  <td className={rowCellClass}>
                    {countSavestates(profile.savestates)} ({profile.savestates.length} folders)
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Profiles
