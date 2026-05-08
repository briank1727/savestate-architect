import { ProfileSummary } from '@renderer/lib/profile'
import {
  deleteProfile,
  listProfileSummaries,
  openProfileFolder
} from '@renderer/lib/profile_management'
import Button from '../components/Button'
import ImportSavestates from '../views/ImportSavestates'
import { useEffect, useState } from 'react'

type View = 'list' | 'import'

function Profiles(): React.JSX.Element {
  const [summaries, setSummaries] = useState<ProfileSummary[]>([])
  const [view, setView] = useState<View>('list')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (view !== 'list') return
    let cancelled = false
    listProfileSummaries()
      .then((result) => {
        if (!cancelled) setSummaries(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [view])

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
      {error && (
        <div className="px-4 py-3 rounded-md bg-[var(--color-background-mute)] border border-red-500/40 text-sm text-red-300">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}
      <table className="w-full border-collapse bg-[var(--color-background-soft)] border border-[var(--ev-c-gray-1)] rounded-lg overflow-hidden text-sm">
        <thead>
          <tr>
            <th className={headerCellClass}>Name</th>
            <th className={headerCellClass}>Folders</th>
            <th className={headerCellClass}>Savestates</th>
            <th className={headerCellClass}></th>
          </tr>
        </thead>
        <tbody>
          {summaries.length === 0 ? (
            <tr>
              <td className="text-center text-[var(--ev-c-text-2)] italic px-3.5 py-6" colSpan={4}>
                No profiles yet.
              </td>
            </tr>
          ) : (
            summaries.map((summary, idx) => {
              const isLast = idx === summaries.length - 1
              const rowCellClass = isLast
                ? cellClass.replace(' border-b border-[var(--ev-c-gray-1)]', '')
                : cellClass
              return (
                <tr key={summary.name} className="hover:bg-[var(--color-background-mute)]">
                  <td className={rowCellClass}>{summary.name}</td>
                  <td className={rowCellClass}>{summary.numFolders}</td>
                  <td className={rowCellClass}>{summary.numSavestates}</td>
                  <td className={rowCellClass}>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          openProfileFolder(summary.name).catch((err) =>
                            setError(err instanceof Error ? err.message : String(err))
                          )
                        }}
                      >
                        Open Folder
                      </Button>
                      <Button
                        className="bg-red-600! hover:bg-red-700!"
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete profile "${summary.name}"? This cannot be undone.`
                            )
                          ) {
                            return
                          }
                          deleteProfile(summary.name)
                            .then(() => listProfileSummaries())
                            .then((result) => setSummaries(result))
                            .catch((err) =>
                              setError(err instanceof Error ? err.message : String(err))
                            )
                        }}
                      >
                        Delete
                      </Button>
                    </div>
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
