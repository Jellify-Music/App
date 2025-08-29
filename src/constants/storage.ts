import { MMKV } from 'react-native-mmkv'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { AsyncStorage } from '@tanstack/react-query-persist-client'
import { StateStorage } from 'zustand/middleware'

console.debug(`Building MMKV storage`)

export const storage = new MMKV()

const storageFunctions = {
	setItem: (key: string, value: string) => {
		storage.set(key, value)
	},
	getItem: (key: string) => {
		const value = storage.getString(key)
		return value === undefined ? null : value
	},
	removeItem: (key: string) => {
		storage.delete(key)
	},
}

const clientStorage: AsyncStorage<string> = storageFunctions

export const queryClientPersister = createAsyncStoragePersister({
	storage: clientStorage,
})

export const stateStorage: StateStorage = storageFunctions
