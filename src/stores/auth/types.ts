import { JellyfinServer } from '@/src/types/JellyfinServer'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models/public-system-info'
import { JellifyUser } from '@/src/types/JellifyUser'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { StateCreator } from 'zustand'

export type SetJellyfinServerParams = JellyfinServer & {
	publicSystemInfo: PublicSystemInfo
}

export type SetServerParams = SetJellyfinServerParams | undefined

type JellifyStoreMutators = [['zustand/devtools', never], ['zustand/persist', unknown]]

type JellifyStoreCreator = StateCreator<JellifyStore, JellifyStoreMutators>

export type JellifyStoreSet = Parameters<JellifyStoreCreator>[0]
export type JellifyStoreGet = Parameters<JellifyStoreCreator>[1]

type JellifyStore = {
	server: JellyfinServer | undefined
	setServer: (params: SetServerParams) => void

	user: JellifyUser | undefined
	setUser: (user: JellifyUser | undefined) => void

	library: JellifyLibrary | undefined
	setLibrary: (library: JellifyLibrary | undefined) => void

	migratedToNitroPlayer: boolean
	setMigratedToNitroPlayer: (migrated: boolean) => void
}

export default JellifyStore
