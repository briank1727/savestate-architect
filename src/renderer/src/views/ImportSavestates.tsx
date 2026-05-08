import { useState } from 'react'
import Button from '../components/Button'
import { Profile } from '@renderer/lib/profile'
import { readCurrentSavestates, saveProfile } from '@renderer/lib/profile_management'

type ImportSavestatesProps = {
  onBack: () => void
}

const ILLEGAL_FOLDER_CHARS_RE = /[\\/:*?"<>|]/g

function sanitizeProfileName(input: string): string {
  return input.replace(ILLEGAL_FOLDER_CHARS_RE, '')
}

function isValidProfileName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  if (trimmed === '.' || trimmed === '..') return false
  return true
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
      const profile = await readCurrentSavestates(profileName)
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

  async function handleSaveProfile(): Promise<void> {
    if (!imported) return
    setBusy(true)
    setError(null)
    try {
      await saveProfile({ name: profileName, savestates: imported.savestates })
      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
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
          maxLength={100}
          onChange={(e) => setProfileName(sanitizeProfileName(e.target.value))}
        />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleImportCurrent}>
          {busy ? 'Importing…' : 'Import Current Savestates'}
        </Button>
        <Button onClick={handleImportFromFolder}>Import from Folder</Button>
        <Button
          onClick={handleSaveProfile}
          disabled={!imported || busy || !isValidProfileName(profileName)}
        >
          Save Profile
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-md bg-[var(--color-background-mute)] border border-red-500/40 text-sm text-red-300">
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      {imported && (
        <div className="flex flex-col gap-1 px-4 py-3 rounded-md bg-[var(--color-background-soft)] border border-green-500/40 text-sm">
          <div className="font-semibold text-green-300">Import Success</div>
          <div>
            <span className="text-[var(--ev-c-text-2)]">Folders:</span>{' '}
            {imported.savestates.length}
          </div>
          <div>
            <span className="text-[var(--ev-c-text-2)]">Total savestates:</span>{' '}
            {totalSavestates}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportSavestates
