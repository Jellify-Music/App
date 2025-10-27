import { isUndefined } from 'lodash'
import {
	createContext,
	ReactNode,
	SetStateAction,
	useContext,
	useEffect,
	useState,
	useMemo,
} from 'react'
import { JellifyLibrary } from '../types/JellifyLibrary'
import { JellifyServer } from '../types/JellifyServer'
import { JellifyUser } from '../types/JellifyUser'
import { storage } from '../constants/storage'
import { MMKVStorageKeys } from '../enums/mmkv-storage-keys'
import { Api } from '@jellyfin/sdk/lib/api'
import { JellyfinInfo } from '../api/info'
import { queryClient } from '../constants/query-client'
import AXIOS_INSTANCE from '../configs/axios.config'

/**
 * The context for the Jellify provider.
 */
interface JellifyContext {
	/**
	 * Whether the user is logged in.
	 */
	loggedIn: boolean

	/**
	 * The {@link Api} client.
	 */
	api: Api | undefined

	/**
	 * The connected {@link JellifyServer} object.
	 */
	server: JellifyServer | undefined

	/**
	 * The signed in {@link JellifyUser} object.
	 */
	user: JellifyUser | undefined

	/**
	 * The selected{@link JellifyLibrary} object.
	 */
	library: JellifyLibrary | undefined

	/**
	 * The function to set the context {@link JellifyServer}.
	 */
	setServer: React.Dispatch<SetStateAction<JellifyServer | undefined>>

	/**
	 * The function to set the context {@link JellifyUser}.
	 */
	setUser: React.Dispatch<SetStateAction<JellifyUser | undefined>>

	/**
	 * The function to set the context {@link JellifyLibrary}.
	 */
	setLibrary: React.Dispatch<SetStateAction<JellifyLibrary | undefined>>

	/**
	 * The function to sign out of Jellify. This will clear the context
	 * and remove all data from the device.
	 */
	signOut: () => void
}

const JellifyContextInitializer = () => {
	const userJson = storage.getString(MMKVStorageKeys.User)
	const serverJson = storage.getString(MMKVStorageKeys.Server)
	const libraryJson = storage.getString(MMKVStorageKeys.Library)
	const apiJson = storage.getString(MMKVStorageKeys.Api)

	const [api, setApi] = useState<Api | undefined>(apiJson ? JSON.parse(apiJson) : undefined)
	const [server, setServer] = useState<JellifyServer | undefined>(
		serverJson ? JSON.parse(serverJson) : undefined,
	)
	const [user, setUser] = useState<JellifyUser | undefined>(
		userJson ? JSON.parse(userJson) : undefined,
	)
	const [library, setLibrary] = useState<JellifyLibrary | undefined>(
		libraryJson ? JSON.parse(libraryJson) : undefined,
	)

	const [loggedIn, setLoggedIn] = useState<boolean>(false)

	const signOut = () => {
		setServer(undefined)
		setUser(undefined)
		setLibrary(undefined)

		queryClient.clear()

		storage.clearAll()
	}

	useEffect(() => {
		if (!isUndefined(server) && !isUndefined(user))
			setApi(JellyfinInfo.createApi(server.url, user.accessToken, AXIOS_INSTANCE))
		else if (!isUndefined(server))
			setApi(JellyfinInfo.createApi(server.url, undefined, AXIOS_INSTANCE))
		else setApi(undefined)

		setLoggedIn(!isUndefined(server) && !isUndefined(user) && !isUndefined(library))
	}, [server, user, library])

	useEffect(() => {
		if (api) storage.set(MMKVStorageKeys.Api, JSON.stringify(api))
		else storage.delete(MMKVStorageKeys.Api)
	}, [api])

	useEffect(() => {
		if (server) storage.set(MMKVStorageKeys.Server, JSON.stringify(server))
		else storage.delete(MMKVStorageKeys.Server)
	}, [server])

	useEffect(() => {
		if (user) storage.set(MMKVStorageKeys.User, JSON.stringify(user))
		else storage.delete(MMKVStorageKeys.User)
	}, [user])

	useEffect(() => {
		if (library) storage.set(MMKVStorageKeys.Library, JSON.stringify(library))
		else storage.delete(MMKVStorageKeys.Library)
	}, [library])

	return {
		loggedIn,
		api,
		server,
		user,
		library,
		setServer,
		setUser,
		setLibrary,
		signOut,
	}
}

const JellifyContext = createContext<JellifyContext>({
	loggedIn: false,
	api: undefined,
	server: undefined,
	user: undefined,
	library: undefined,
	setServer: () => {},
	setUser: () => {},
	setLibrary: () => {},
	signOut: () => {},
})

/**
 * Top level provider for Jellify. Provides the {@link JellifyContext} to all children, containing
 * whether the user is logged in, and the {@link Api} client
 * @param children The children to render
 * @returns The {@link JellifyProvider} component
 */
export const JellifyProvider: ({ children }: { children: ReactNode }) => React.JSX.Element = ({
	children,
}: {
	children: ReactNode
}) => {
	const context = JellifyContextInitializer()

	// Memoize the context value to prevent unnecessary re-renders
	const value = useMemo(
		() => context,
		[
			context.loggedIn,
			context.api,
			context.server?.url,
			context.user?.id,
			context.library?.musicLibraryId,
		],
	)

	return <JellifyContext.Provider value={value}>{children}</JellifyContext.Provider>
}

/**
 * A hook to access the {@link JellifyContext}
 *
 * @returns The {@link JellifyContext}
 */
export const useJellifyContext = () => useContext(JellifyContext)
