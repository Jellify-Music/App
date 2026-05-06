import { getApi, getUser } from '../../../stores'
import { useQuery } from '@tanstack/react-query'
import { LibrariesQuery, PlaylistLibraryQuery } from './queries'
import { queryClient } from '../../../constants/query-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

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

export async function ensurePlaylistLibraryQueryData() {
	const api = getApi()

	const user = getUser()

	return await queryClient.ensureQueryData<BaseItemDto | undefined>(
		PlaylistLibraryQuery(api, user),
	)
}
