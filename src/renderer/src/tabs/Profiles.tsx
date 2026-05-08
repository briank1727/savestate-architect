import { Profile } from '@renderer/lib/profile'
import Button from '../components/Button'
import { useEffect, useState } from 'react'

function countSavestates(savestates: object[][]): number {
  return savestates.reduce((total, folder) => total + folder.length, 0)
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString()
}

function Profiles(): React.JSX.Element {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    const dummyProfiles: Profile[] = [
      {
        name: 'Any%',
        num_folders: 3,
        date_created: new Date('2026-01-12T14:32:00'),
        savestates: [
          [{}, {}, {}, {}],
          [{}, {}],
          [{}, {}, {}, {}, {}, {}]
        ]
      },
      {
        name: 'All Bosses',
        num_folders: 2,
        date_created: new Date('2026-02-28T09:15:00'),
        savestates: [
          [{}, {}, {}],
          [{}, {}, {}, {}, {}]
        ]
      },
      {
        name: '112%',
        num_folders: 5,
        date_created: new Date('2026-04-03T18:47:00'),
        savestates: [[{}, {}], [{}], [{}, {}, {}], [{}, {}, {}, {}], [{}, {}]]
      },
      {
        name: 'Practice',
        num_folders: 1,
        date_created: new Date('2026-05-01T11:00:00'),
        savestates: [[]]
      }
    ]
    setProfiles(dummyProfiles)
  }, [])

  const cellClass = 'px-3.5 py-2.5 text-left border-b border-[var(--ev-c-gray-1)]'
  const headerCellClass =
    cellClass +
    ' bg-[var(--color-background-mute)] text-[var(--ev-c-text-2)] font-semibold text-xs uppercase tracking-[0.04em]'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-start">
        <Button>Add Profile</Button>
      </div>
      <table className="w-full border-collapse bg-[var(--color-background-soft)] border border-[var(--ev-c-gray-1)] rounded-lg overflow-hidden text-sm">
        <thead>
          <tr>
            <th className={headerCellClass}>Name</th>
            <th className={headerCellClass}>Savestates</th>
            <th className={headerCellClass}>Date Created</th>
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
                  <td className={rowCellClass}>{formatDate(profile.date_created)}</td>
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
