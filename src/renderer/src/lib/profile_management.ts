import { Profile } from './profile'

const LOG = '[profile_management]'

type StoredProfile = Omit<Profile, 'date_created'> & { date_created: string | Date }

function reviveProfile(p: StoredProfile): Profile {
  return { ...p, date_created: new Date(p.date_created) }
}

export async function listProfiles(): Promise<Profile[]> {
  console.log(`${LOG} listProfiles() called`)
  if (!window.api?.profiles) {
    console.error(`${LOG} window.api.profiles is undefined — preload bridge not loaded`)
    throw new Error('Preload bridge missing — window.api.profiles is undefined')
  }
  try {
    const stored = (await window.api.profiles.list()) as StoredProfile[]
    console.log(`${LOG} listProfiles raw IPC result:`, stored)
    const result = stored.map(reviveProfile)
    console.log(`${LOG} listProfiles returning ${result.length} profiles`)
    return result
  } catch (err) {
    console.error(`${LOG} listProfiles error:`, err)
    throw err
  }
}

export async function pickFolder(): Promise<string | null> {
  console.log(`${LOG} pickFolder() called`)
  try {
    const path = (await window.api.profiles.pickFolder()) as string | null
    console.log(`${LOG} pickFolder returned:`, path)
    return path
  } catch (err) {
    console.error(`${LOG} pickFolder error:`, err)
    throw err
  }
}

export async function importFromFolder(profileName: string): Promise<Profile | null> {
  console.log(`${LOG} importFromFolder("${profileName}") called`)
  const folderPath = await pickFolder()
  if (!folderPath) {
    console.log(`${LOG} importFromFolder cancelled (no folder picked)`)
    return null
  }
  try {
    const stored = (await window.api.profiles.importFromFolder(
      profileName,
      folderPath
    )) as StoredProfile
    console.log(`${LOG} importFromFolder raw IPC result:`, stored)
    const profile = reviveProfile(stored)
    console.log(`${LOG} importFromFolder returning profile:`, profile)
    return profile
  } catch (err) {
    console.error(`${LOG} importFromFolder error:`, err)
    throw err
  }
}

export async function importCurrentSavestates(profileName: string): Promise<Profile> {
  console.log(`${LOG} importCurrentSavestates("${profileName}") called`)
  if (!window.api?.profiles) {
    console.error(`${LOG} window.api.profiles is undefined — preload bridge not loaded`)
    throw new Error('Preload bridge missing — window.api.profiles is undefined')
  }
  try {
    const stored = (await window.api.profiles.importCurrent(profileName)) as StoredProfile
    console.log(`${LOG} importCurrentSavestates raw IPC result:`, stored)
    const profile = reviveProfile(stored)
    console.log(
      `${LOG} importCurrentSavestates returning profile: name="${profile.name}", folders=${profile.savestates.length}, total savestates=${profile.savestates.reduce((s, f) => s + f.length, 0)}`
    )
    return profile
  } catch (err) {
    console.error(`${LOG} importCurrentSavestates error:`, err)
    throw err
  }
}

export async function deleteProfile(profileName: string): Promise<void> {
  console.log(`${LOG} deleteProfile("${profileName}") called`)
  try {
    await window.api.profiles.delete(profileName)
    console.log(`${LOG} deleteProfile done`)
  } catch (err) {
    console.error(`${LOG} deleteProfile error:`, err)
    throw err
  }
}
