import { createMMKV } from 'react-native-mmkv'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { StateStorage } from 'zustand/middleware'

export const storage = createMMKV()

const mmkvStorageFunctions = {
	setItem: (key: string, value: string) => {
		storage.set(key, value)
	},
	getItem: (key: string) => {
		const value = storage.getString(key)
		return value === undefined ? null : value
	},
	removeItem: (key: string) => {
		storage.remove(key)
	},
}

export const queryClientPersister = createSyncStoragePersister({
	storage: mmkvStorageFunctions,
})

export const mmkvStateStorage: StateStorage = mmkvStorageFunctions
