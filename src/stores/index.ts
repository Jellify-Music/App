import { create } from 'zustand'
import { JellifyLibrary } from '../types/JellifyLibrary'
import { JellifyServer } from '../types/JellifyServer'
import { JellifyUser } from '../types/JellifyUser'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { stateStorage, storage } from '../constants/storage'
import { MMKVStorageKeys } from '../enums/mmkv-storage-keys'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { useCallback, useEffect, useState } from 'react'
import { JellyfinInfo } from '../api/info'
import AXIOS_INSTANCE from '../configs/axios.config'
import { queryClient } from '../constants/query-client'

type JellifyContext = {
	server: JellifyServer | undefined
	setServer: (server: JellifyServer | undefined) => void

	user: JellifyUser | undefined
	setUser: (user: JellifyUser | undefined) => void

	library: JellifyLibrary | undefined
	setLibrary: (library: JellifyLibrary | undefined) => void

	api: Api | undefined
	setApi: (api: Api | undefined) => void
}

const useJellifyStore = create<JellifyContext>()(
	devtools(
		persist(
			(set) => ({
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

				api: undefined,
				setApi: (api: Api | undefined) => set({ api }),
			}),
			{
				name: 'jellify-context-storage',
				storage: createJSONStorage(() => stateStorage),
			},
		),
	),
)

export const useJellifyServer: () => [
	JellifyServer | undefined,
	(user: JellifyServer | undefined) => void,
] = () => {
	return useJellifyStore((state) => [state.server, state.setServer])
}

export const useJellifyUser: () => [
	user: JellifyUser | undefined,
	setUser: (user: JellifyUser | undefined) => void,
] = () => {
	return useJellifyStore((state) => [state.user, state.setUser])
}

export const useJellifyLibrary: () => [
	library: JellifyLibrary | undefined,
	setLibrary: (library: JellifyLibrary | undefined) => void,
] = () => {
	return useJellifyStore((state) => [state.library, state.setLibrary])
}

export const useApi: () => Api | undefined = () => useJellifyStore((state) => state.api)

export const useApiClient: () => void = () => {
	const setApi = useJellifyStore((state) => state.setApi)

	const [server] = useJellifyServer()
	const [user] = useJellifyUser()

	useEffect(() => {
		if (!isUndefined(server) && !isUndefined(user))
			setApi(JellyfinInfo.createApi(server.url, user.accessToken, AXIOS_INSTANCE))
		else if (!isUndefined(server))
			setApi(JellyfinInfo.createApi(server.url, undefined, AXIOS_INSTANCE))
		else setApi(undefined)
	}, [server, user, setApi])
}

export const useSignOut = () => {
	const [setServer, setUser, setLibrary] = useJellifyStore((state) => [
		state.setServer,
		state.setUser,
		state.setLibrary,
	])

	return useCallback(() => {
		setServer(undefined)
		setUser(undefined)
		setLibrary(undefined)

		queryClient.clear()

		storage.clearAll()
	}, [setServer, setUser, setLibrary])
}

export default useJellifyStore
