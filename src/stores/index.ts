import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { JellifyLibrary } from '../types/JellifyLibrary'
import { JellifyServer } from '../types/JellifyServer'
import { JellifyUser } from '../types/JellifyUser'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage, stateStorage, storage } from '../constants/storage'
import { MMKVStorageKeys } from '../enums/mmkv-storage-keys'
import { Api } from '@jellyfin/sdk'
import { useCallback, useMemo } from 'react'
import { JellyfinInfo } from '../api/info'
import AXIOS_INSTANCE from '../configs/axios.config'
import { queryClient } from '../constants/query-client'

type JellifyStore = {
	server: JellifyServer | undefined
	setServer: (server: JellifyServer | undefined) => void

	user: JellifyUser | undefined
	setUser: (user: JellifyUser | undefined) => void

	library: JellifyLibrary | undefined
	setLibrary: (library: JellifyLibrary | undefined) => void
}

const useJellifyStore = create<JellifyStore>()(
	devtools(
		persist(
			(set, get) => ({
				server: storage.getString(MMKVStorageKeys.Server)
					? (JSON.parse(storage.getString(MMKVStorageKeys.Server)!) as JellifyServer)
					: undefined,

				setServer: (server: JellifyServer | undefined) => set({ server }),

				user: storage.getString(MMKVStorageKeys.User)
					? (JSON.parse(storage.getString(MMKVStorageKeys.User)!) as JellifyUser)
					: undefined,

				setUser: (user: JellifyUser | undefined) => set({ user }),

				library: storage.getString(MMKVStorageKeys.Library)
					? (JSON.parse(storage.getString(MMKVStorageKeys.Library)!) as JellifyLibrary)
					: undefined,

				setLibrary: (library: JellifyLibrary | undefined) => set({ library }),
			}),
			{
				name: 'jellify-context-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const useJellifyServer: () => [
	JellifyServer | undefined,
	(user: JellifyServer | undefined) => void,
] = () => {
	return useJellifyStore(useShallow((state) => [state.server, state.setServer] as const))
}

export const useJellifyUser: () => [
	user: JellifyUser | undefined,
	setUser: (user: JellifyUser | undefined) => void,
] = () => {
	return useJellifyStore(useShallow((state) => [state.user, state.setUser] as const))
}

export const useJellifyLibrary: () => [
	library: JellifyLibrary | undefined,
	setLibrary: (library: JellifyLibrary | undefined) => void,
] = () => {
	return useJellifyStore(useShallow((state) => [state.library, state.setLibrary] as const))
}

export const useApi: () => Api | undefined = () => {
	const [serverUrl, userAccessToken] = useJellifyStore(
		useShallow((state) => [state.server?.url, state.user?.accessToken] as const),
	)

	return useMemo(() => {
		if (!serverUrl) return undefined
		else return JellyfinInfo.createApi(serverUrl, userAccessToken, AXIOS_INSTANCE)
	}, [serverUrl, userAccessToken])
}

export const getApiFromStore = (): Api | undefined => {
	const [serverUrl, userAccessToken] = [
		useJellifyStore.getState().server?.url,
		useJellifyStore.getState().user?.accessToken,
	]

	if (!serverUrl) return undefined
	else return JellyfinInfo.createApi(serverUrl, userAccessToken, AXIOS_INSTANCE)
}

export const useSignOut = () => {
	const [setServer, setUser, setLibrary] = useJellifyStore(
		useShallow((state) => [state.setServer, state.setUser, state.setLibrary]),
	)

	return useCallback(() => {
		setServer(undefined)
		setUser(undefined)
		setLibrary(undefined)

		queryClient.clear()

		storage.clearAll()
	}, [setServer, setUser, setLibrary])
}

export default useJellifyStore
