import { createMMKV } from 'react-native-mmkv'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { AsyncStorage as TanstackAsyncStorage } from '@tanstack/react-query-persist-client'
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

const clientStorage: TanstackAsyncStorage<string> = mmkvStorageFunctions

export const queryClientPersister = createAsyncStoragePersister({
	storage: clientStorage,
})

export const stateStorage: StateStorage = mmkvStorageFunctions

export const mmkvStateStorage: StateStorage = mmkvStorageFunctions
