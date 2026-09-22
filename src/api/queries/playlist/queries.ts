import { infiniteQueryOptions } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ApiLimits } from '../../../configs/querying/index.config'
import { getApi, getUser } from '../../../stores/auth/utils'
import { PlaylistTracksQueryKey, UserPlaylistsQueryKey } from './keys'
import { fetchPlaylistTracks, fetchUserPlaylists } from './utils'

export const UserPlaylistsQuery = (api = getApi(), user = getUser()) =>
	infiniteQueryOptions({
		queryKey: UserPlaylistsQueryKey(user),
		queryFn: ({ signal }) => fetchUserPlaylists(api, user, [], signal),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) =>
			lastPage && lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined,
	})

export const PlaylistTracksQuery = (playlist: BaseItemDto, api = getApi()) =>
	infiniteQueryOptions({
		queryKey: PlaylistTracksQueryKey(playlist),
		queryFn: ({ pageParam, signal }) =>
			fetchPlaylistTracks(api, playlist.Id!, pageParam, signal),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) =>
			lastPage && lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined,
	})
