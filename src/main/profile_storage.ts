import { app, dialog, ipcMain } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'

export type Profile = {
  name: string
  savestates: object[][]
}

export type ProfileSummary = {
  name: string
  numFolders: number
  numSavestates: number
}

const SAVESTATE_FILE_RE = /^savestate(\d+)\.json$/i
const LOG = '[profile_storage]'

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

async function readSavestateFolder(folderPath: string): Promise<object[]> {
  const fileEntries = await fs.readdir(folderPath, { withFileTypes: true })
  const savestateFiles = fileEntries
    .filter((e) => e.isFile() && SAVESTATE_FILE_RE.test(e.name))
    .sort((a, b) => {
      const aNum = parseInt(a.name.match(SAVESTATE_FILE_RE)![1], 10)
      const bNum = parseInt(b.name.match(SAVESTATE_FILE_RE)![1], 10)
      return aNum - bNum
    })
  console.log(
    `${LOG}   folder "${folderPath}" has ${savestateFiles.length} savestate files:`,
    savestateFiles.map((f) => f.name)
  )

  const savestates: object[] = []
  for (const file of savestateFiles) {
    const raw = await fs.readFile(join(folderPath, file.name), 'utf-8')
    try {
      savestates.push(JSON.parse(raw))
    } catch (err) {
      console.warn(`${LOG}   failed to parse ${file.name}:`, err)
    }
  }
  return savestates
}

async function readSavestatesFromSource(rootPath: string): Promise<object[][]> {
  console.log(`${LOG} readSavestatesFromSource("${rootPath}")`)
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(rootPath, { withFileTypes: true })
  } catch (err) {
    console.error(`${LOG} readdir failed for "${rootPath}":`, err)
    throw err
  }
  console.log(
    `${LOG}   directory contains ${entries.length} entries:`,
    entries.map((e) => `${e.name}${e.isDirectory() ? '/' : ''}`)
  )

  const numberedFolders = entries
    .filter((e) => e.isDirectory() && /^\d+$/.test(e.name))
    .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10))

  if (numberedFolders.length > 0) {
    console.log(
      `${LOG}   found ${numberedFolders.length} numbered folders:`,
      numberedFolders.map((f) => f.name)
    )
    const savestates: object[][] = []
    for (const folder of numberedFolders) {
      savestates.push(await readSavestateFolder(join(rootPath, folder.name)))
    }
    console.log(
      `${LOG} readSavestatesFromSource returning ${savestates.length} folders, ${savestates.reduce((s, f) => s + f.length, 0)} total savestates`
    )
    return savestates
  }

  console.log(`${LOG}   no numbered subfolders — falling back to flat .json scan`)
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  if (jsonFiles.length === 0) {
    console.log(`${LOG}   flat scan found no .json files either; returning []`)
    return []
  }
  const flat: object[] = []
  for (const file of jsonFiles) {
    const raw = await fs.readFile(join(rootPath, file.name), 'utf-8')
    try {
      flat.push(JSON.parse(raw))
    } catch (err) {
      console.warn(`${LOG}   failed to parse ${file.name}:`, err)
    }
  }
  console.log(`${LOG} readSavestatesFromSource returning 1 folder with ${flat.length} savestates`)
  return [flat]
}

async function loadProfile(name: string): Promise<Profile> {
  console.log(`${LOG} loadProfile("${name}") start`)
  validateProfileName(name)
  const dir = getProfileDir(name)
  console.log(`${LOG} loadProfile reading dir: ${dir}`)
  const stat = await fs.stat(dir)
  const savestates = await readSavestatesFromSource(dir)
  console.log(
    `${LOG} loadProfile("${name}") done — ${savestates.length} folders, ${savestates.reduce((s, f) => s + f.length, 0)} total savestates`
  )
  return {
    name,
    savestates
  }
}

async function summarizeProfileDir(rootPath: string): Promise<{
  numFolders: number
  numSavestates: number
}> {
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(rootPath, { withFileTypes: true })
  } catch (err) {
    console.error(`${LOG} summarizeProfileDir readdir failed for "${rootPath}":`, err)
    throw err
  }

  const numberedFolders = entries.filter((e) => e.isDirectory() && /^\d+$/.test(e.name))

  if (numberedFolders.length > 0) {
    let numSavestates = 0
    for (const folder of numberedFolders) {
      const folderEntries = await fs.readdir(join(rootPath, folder.name), { withFileTypes: true })
      numSavestates += folderEntries.filter((e) => e.isFile() && SAVESTATE_FILE_RE.test(e.name))
        .length
    }
    return { numFolders: numberedFolders.length, numSavestates }
  }

  const flatJson = entries.filter(
    (e) => e.isFile() && e.name.toLowerCase().endsWith('.json')
  ).length
  if (flatJson === 0) return { numFolders: 0, numSavestates: 0 }
  return { numFolders: 1, numSavestates: flatJson }
}

async function loadProfileSummaries(): Promise<ProfileSummary[]> {
  const root = getProfilesRoot()
  console.log(`${LOG} loadProfileSummaries reading root: ${root}`)
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`${LOG} loadProfileSummaries: root does not exist yet, returning []`)
      return []
    }
    console.error(`${LOG} loadProfileSummaries error:`, err)
    throw err
  }

  const profileDirs = entries.filter((e) => e.isDirectory())
  console.log(
    `${LOG} loadProfileSummaries found ${profileDirs.length} profile dirs:`,
    profileDirs.map((d) => d.name)
  )

  const summaries: ProfileSummary[] = []
  for (const entry of profileDirs) {
    const { numFolders, numSavestates } = await summarizeProfileDir(getProfileDir(entry.name))
    summaries.push({ name: entry.name, numFolders, numSavestates })
  }
  console.log(`${LOG} loadProfileSummaries returning ${summaries.length} summaries`)
  return summaries
}

async function loadProfiles(): Promise<Profile[]> {
  const root = getProfilesRoot()
  console.log(`${LOG} loadProfiles reading root: ${root}`)
  try {
    const entries = await fs.readdir(root, { withFileTypes: true })
    const profileDirs = entries.filter((e) => e.isDirectory())
    console.log(
      `${LOG} loadProfiles found ${profileDirs.length} profile dirs:`,
      profileDirs.map((d) => d.name)
    )
    const profiles: Profile[] = []
    for (const entry of profileDirs) {
      profiles.push(await loadProfile(entry.name))
    }
    return profiles
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`${LOG} loadProfiles: root does not exist yet, returning []`)
      return []
    }
    console.error(`${LOG} loadProfiles error:`, err)
    throw err
  }
}

async function saveProfile(profile: Profile): Promise<void> {
  validateProfileName(profile.name)
  const dir = getProfileDir(profile.name)
  console.log(`${LOG} saveProfile("${profile.name}") writing to: ${dir}`)
  console.log(
    `${LOG} saveProfile structure: ${profile.savestates.length} folders, sizes=[${profile.savestates.map((f) => f.length).join(', ')}]`
  )
  await fs.rm(dir, { recursive: true, force: true })
  await fs.mkdir(dir, { recursive: true })

  for (let folderIdx = 0; folderIdx < profile.savestates.length; folderIdx++) {
    const folderPath = join(dir, String(folderIdx))
    await fs.mkdir(folderPath, { recursive: true })

    const folderSavestates = profile.savestates[folderIdx]
    for (let i = 0; i < folderSavestates.length; i++) {
      const filePath = join(folderPath, `savestate${i}.json`)
      await fs.writeFile(filePath, JSON.stringify(folderSavestates[i], null, 2), 'utf-8')
      console.log(`${LOG}   wrote ${filePath}`)
    }
  }
  console.log(`${LOG} saveProfile("${profile.name}") done`)
}

async function pickFolder(): Promise<string | null> {
  console.log(`${LOG} pickFolder dialog opening`)
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  console.log(`${LOG} pickFolder result:`, result)
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

async function importFromFolder(profileName: string, folderPath: string): Promise<Profile> {
  console.log(`${LOG} importFromFolder("${profileName}", "${folderPath}")`)
  const savestates = await readSavestatesFromSource(folderPath)
  const profile: Profile = {
    name: profileName,
    savestates
  }
  await saveProfile(profile)
  return loadProfile(profileName)
}

async function importCurrent(profileName: string): Promise<Profile> {
  const sourceDir = getDefaultSilksongSaveDir()
  console.log(`${LOG} importCurrent("${profileName}") source: ${sourceDir}`)
  const savestates = await readSavestatesFromSource(sourceDir)
  const profile: Profile = {
    name: profileName,
    savestates
  }
  await saveProfile(profile)
  return loadProfile(profileName)
}

async function deleteProfile(profileName: string): Promise<void> {
  console.log(`${LOG} deleteProfile("${profileName}")`)
  validateProfileName(profileName)
  await fs.rm(getProfileDir(profileName), { recursive: true, force: true })
}

export function registerProfileIpc(): void {
  console.log(`${LOG} registering IPC handlers`)
  ipcMain.handle('profiles:list', () => loadProfiles())
  ipcMain.handle('profiles:list-summaries', () => loadProfileSummaries())
  ipcMain.handle('profiles:pick-folder', () => pickFolder())
  ipcMain.handle('profiles:import-from-folder', (_e, name: string, folderPath: string) =>
    importFromFolder(name, folderPath)
  )
  ipcMain.handle('profiles:import-current', (_e, name: string) => importCurrent(name))
  ipcMain.handle('profiles:delete', (_e, name: string) => deleteProfile(name))
}
