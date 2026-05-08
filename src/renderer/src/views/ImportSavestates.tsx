import { useState } from 'react'
import Button from '../components/Button'
import { Profile } from '@renderer/lib/profile'
import { importCurrentSavestates } from '@renderer/lib/profile_management'

type ImportSavestatesProps = {
  onBack: () => void
}

function ImportSavestates({ onBack }: ImportSavestatesProps): React.JSX.Element {
  const [profileName, setProfileName] = useState('Test Profile')
  const [imported, setImported] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleImportCurrent(): Promise<void> {
    setBusy(true)
    setError(null)
    setImported(null)
    try {
      const profile = await importCurrentSavestates(profileName)
      setImported(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  function handleImportFromFolder(): void {
    // TODO: implement importing savestates from a selected folder
  }

  const totalSavestates = imported
    ? imported.savestates.reduce((acc, folder) => acc + folder.length, 0)
    : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-start">
        <Button onClick={onBack}>← Back</Button>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-[var(--ev-c-text-2)]">Profile name</label>
        <input
          className="px-3 py-2 rounded-md bg-[var(--color-background-mute)] border border-[var(--ev-c-gray-1)] text-[var(--ev-c-text-1)] text-sm outline-none focus:border-[var(--ev-c-text-2)]"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleImportCurrent} disabled={busy || !profileName.trim()}>
          {busy ? 'Importing…' : 'Import Current Savestates'}
        </Button>
        <Button onClick={handleImportFromFolder} disabled={busy}>
          Import from Folder
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-md bg-[var(--color-background-mute)] border border-red-500/40 text-sm text-red-300">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      {imported && (
        <div className="flex flex-col gap-2 px-4 py-3 rounded-md bg-[var(--color-background-soft)] border border-[var(--ev-c-gray-1)] text-sm">
          <div className="text-[var(--ev-c-text-2)] uppercase text-xs tracking-[0.04em] font-semibold">
            Imported profile
          </div>
          <div>
            <span className="text-[var(--ev-c-text-2)]">Name:</span>{' '}
            <span className="font-semibold">{imported.name}</span>
          </div>
          <div>
            <span className="text-[var(--ev-c-text-2)]">Date created:</span>{' '}
            {imported.date_created.toLocaleString()}
          </div>
          <div>
            <span className="text-[var(--ev-c-text-2)]">Folders:</span> {imported.savestates.length}
          </div>
          <div>
            <span className="text-[var(--ev-c-text-2)]">Total savestates:</span> {totalSavestates}
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-[var(--ev-c-text-2)] hover:text-[var(--ev-c-text-1)]">
              Raw JSON
            </summary>
          </details>
        </div>
      )}
    </div>
  )
}

export default ImportSavestates
