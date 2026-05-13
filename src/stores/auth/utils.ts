import { JellyfinInfo } from '../../api/info'
import useJellifyStore from '.'
import { JellyfinServer } from '../../types/JellyfinServer'
import { Api } from '@jellyfin/sdk'
import AXIOS_INSTANCE from '../../configs/axios.config'
import { JellifyUser } from '../../types/JellifyUser'
import { JellifyLibrary } from '../../types/JellifyLibrary'

/**
 * A utility function to get the current Jellyfin server
 * in the Zustand store.
 *
 * This is useful for getting the server outside of a
 * React component.
 *
 * @returns The current {@link JellyfinServer}
 */
export const getServer = () => {
	const { server } = useJellifyStore.getState()

	return server
}

/**
 * A utility function to get the current Jellyfin API instance
 * in the Zustand store.
 *
 * This is useful for getting the API instance outside of a
 * React component.
 *
 * @returns The current {@link Api} instance if one can be created
 */
export const getApi = (): Api | undefined => {
	const [serverUrl, userAccessToken] = [
		useJellifyStore.getState().server?.url,
		useJellifyStore.getState().user?.accessToken,
	]

	if (!serverUrl) return undefined
	else return JellyfinInfo.createApi(serverUrl, userAccessToken, AXIOS_INSTANCE)
}

/**
 *
 * @returns The current {@link }
 */
export const getUser = (): JellifyUser | undefined => useJellifyStore.getState().user

export const getLibrary = (): JellifyLibrary | undefined => useJellifyStore.getState().library
