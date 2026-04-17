import { createMMKV } from 'react-native-mmkv'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { AsyncStorage as TanstackAsyncStorage } from '@tanstack/react-query-persist-client'
import { StateStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = createMMKV()

const storageFunctions = {
	setItem: async (key: string, value: string) => {
		await AsyncStorage.setItem(key, value)
	},
	getItem: async (key: string) => {
		const value = await AsyncStorage.getItem(key)
		return value === undefined ? null : value
	},
	removeItem: async (key: string) => {
		await AsyncStorage.removeItem(key)
	},
}

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

const clientStorage: TanstackAsyncStorage<string> = storageFunctions

export const queryClientPersister = createAsyncStoragePersister({
	storage: clientStorage,
})

export const stateStorage: StateStorage = storageFunctions

export const mmkvStateStorage: StateStorage = mmkvStorageFunctions
