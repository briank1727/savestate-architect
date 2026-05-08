import { Profile } from './profile'

type StoredProfile = Omit<Profile, 'date_created'> & { date_created: string | Date }

function reviveProfile(p: StoredProfile): Profile {
  return { ...p, date_created: new Date(p.date_created) }
}

export async function listProfiles(): Promise<Profile[]> {
  const stored = (await window.api.profiles.list()) as StoredProfile[]
  return stored.map(reviveProfile)
}

export async function pickFolder(): Promise<string | null> {
  return (await window.api.profiles.pickFolder()) as string | null
}

export async function importFromFolder(profileName: string): Promise<Profile | null> {
  const folderPath = await pickFolder()
  if (!folderPath) return null
  const stored = (await window.api.profiles.importFromFolder(
    profileName,
    folderPath
  )) as StoredProfile
  return reviveProfile(stored)
}

export async function importCurrentSavestates(profileName: string): Promise<Profile> {
  const stored = (await window.api.profiles.importCurrent(profileName)) as StoredProfile
  return reviveProfile(stored)
}

export async function deleteProfile(profileName: string): Promise<void> {
  await window.api.profiles.delete(profileName)
}
