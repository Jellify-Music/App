import { getApi, getUser } from '../../../stores'
import { useQuery } from '@tanstack/react-query'
import { LibrariesQuery, PlaylistLibraryQuery } from './queries'

export const useLibraries = () => {
	const api = getApi()

	const user = getUser()

	return useQuery(LibrariesQuery(api, user))
}

export const usePlaylistLibrary = () => {
	const api = getApi()

	const user = getUser()

	return useQuery(PlaylistLibraryQuery(api, user))
}
