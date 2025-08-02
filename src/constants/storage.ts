import { MMKV } from 'react-native-mmkv'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

console.debug(`Building MMKV storage`)

export const storage = new MMKV()

const clientStorage = {
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

export const clientPersister = createAsyncStoragePersister({
	storage: clientStorage,
})
