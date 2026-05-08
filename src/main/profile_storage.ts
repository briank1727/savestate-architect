import { app, dialog, ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'

export type Profile = {
  name: string
  date_created: Date
  savestates: object[][]
}

const SAVESTATE_FILE_RE = /^savestate(\d+)\.json$/i

function getProfilesRoot(): string {
  return join(app.getPath('userData'), 'profiles')
}

function getProfileDir(name: string): string {
  return join(getProfilesRoot(), name)
}

function validateProfileName(name: string): void {
  if (!name || /[\\/:*?"<>|]/.test(name) || name === '.' || name === '..') {
    throw new Error(`Invalid profile name: "${name}"`)
  }
}

function getDefaultSilksongSaveDir(): string {
  if (process.platform === 'win32') {
    return join(
      app.getPath('home'),
      'AppData',
      'LocalLow',
      'Team Cherry',
      'Hollow Knight Silksong',
      'DebugModData',
      'Savestates 1.0'
    )
  }
  if (process.platform === 'darwin') {
    return join(
      app.getPath('home'),
      'Library',
      'Application Support',
      'unity.Team Cherry.Hollow Knight Silksong',
      'DebugModData',
      'Savestates 1.0'
    )
  }
  return join(
    app.getPath('home'),
    '.config',
    'unity3d',
    'Team Cherry',
    'Hollow Knight Silksong',
    'DebugModData',
    'Savestates 1.0'
  )
}

async function loadProfile(name: string): Promise<Profile> {
  validateProfileName(name)
  const dir = getProfileDir(name)
  const stat = await fs.stat(dir)

  const entries = await fs.readdir(dir, { withFileTypes: true })
  const numberedFolders = entries
    .filter((e) => e.isDirectory() && /^\d+$/.test(e.name))
    .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10))

  const savestates: object[][] = []
  for (const folder of numberedFolders) {
    const folderPath = join(dir, folder.name)
    const fileEntries = await fs.readdir(folderPath, { withFileTypes: true })
    const savestateFiles = fileEntries
      .filter((e) => e.isFile() && SAVESTATE_FILE_RE.test(e.name))
      .sort((a, b) => {
        const aNum = parseInt(a.name.match(SAVESTATE_FILE_RE)![1], 10)
        const bNum = parseInt(b.name.match(SAVESTATE_FILE_RE)![1], 10)
        return aNum - bNum
      })

    const folderSavestates: object[] = []
    for (const file of savestateFiles) {
      const raw = await fs.readFile(join(folderPath, file.name), 'utf-8')
      try {
        folderSavestates.push(JSON.parse(raw))
      } catch {
        // skip files that aren't valid JSON
      }
    }
    savestates.push(folderSavestates)
  }

  return {
    name,
    date_created: stat.birthtime,
    savestates
  }
}

async function loadProfiles(): Promise<Profile[]> {
  const root = getProfilesRoot()
  try {
    const entries = await fs.readdir(root, { withFileTypes: true })
    const profileDirs = entries.filter((e) => e.isDirectory())
    const profiles: Profile[] = []
    for (const entry of profileDirs) {
      profiles.push(await loadProfile(entry.name))
    }
    return profiles
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}

async function saveProfile(profile: Profile): Promise<void> {
  validateProfileName(profile.name)
  const dir = getProfileDir(profile.name)
  await fs.rm(dir, { recursive: true, force: true })
  await fs.mkdir(dir, { recursive: true })

  for (let folderIdx = 0; folderIdx < profile.savestates.length; folderIdx++) {
    const folderPath = join(dir, String(folderIdx))
    await fs.mkdir(folderPath, { recursive: true })

    const folderSavestates = profile.savestates[folderIdx]
    for (let i = 0; i < folderSavestates.length; i++) {
      const filePath = join(folderPath, `savestate${i}.json`)
      await fs.writeFile(filePath, JSON.stringify(folderSavestates[i], null, 2), 'utf-8')
    }
  }
}

async function pickFolder(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

async function readSavestatesFromFlatFolder(folderPath: string): Promise<object[]> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  const savestates: object[] = []
  for (const file of jsonFiles) {
    const raw = await fs.readFile(join(folderPath, file.name), 'utf-8')
    try {
      savestates.push(JSON.parse(raw))
    } catch {
      // skip files that aren't valid JSON
    }
  }
  return savestates
}

async function importFromFolder(profileName: string, folderPath: string): Promise<Profile> {
  const savestates = await readSavestatesFromFlatFolder(folderPath)
  const profile: Profile = {
    name: profileName,
    date_created: new Date(),
    savestates: [savestates]
  }
  await saveProfile(profile)
  return loadProfile(profileName)
}

async function importCurrent(profileName: string): Promise<Profile> {
  const savestates = await readSavestatesFromFlatFolder(getDefaultSilksongSaveDir())
  const profile: Profile = {
    name: profileName,
    date_created: new Date(),
    savestates: [savestates]
  }
  await saveProfile(profile)
  return loadProfile(profileName)
}

async function deleteProfile(profileName: string): Promise<void> {
  validateProfileName(profileName)
  await fs.rm(getProfileDir(profileName), { recursive: true, force: true })
}

export function registerProfileIpc(): void {
  ipcMain.handle('profiles:list', () => loadProfiles())
  ipcMain.handle('profiles:pick-folder', () => pickFolder())
  ipcMain.handle('profiles:import-from-folder', (_e, name: string, folderPath: string) =>
    importFromFolder(name, folderPath)
  )
  ipcMain.handle('profiles:import-current', (_e, name: string) => importCurrent(name))
  ipcMain.handle('profiles:delete', (_e, name: string) => deleteProfile(name))
}
