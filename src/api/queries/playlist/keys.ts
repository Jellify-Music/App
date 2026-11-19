import { QueryKeys } from '../../../enums/query-keys'
import { JellifyUser } from '@/src/types/JellifyUser'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

/**
 * Every playlist query lives under this root, so invalidating it
 * refreshes the user playlists, public playlists and all playlist tracks
 */
export const PlaylistsQueryKey = [QueryKeys.Playlists]

export const UserPlaylistsQueryKey = (user: JellifyUser | undefined) => [
	...PlaylistsQueryKey,
	'user',
	user?.id,
]

export const PublicPlaylistsQueryKey = () => [...PlaylistsQueryKey, 'public']

/**
 * A playlist's tracks are shared between the user and public playlist caches,
 * since the contents are the same regardless of where the playlist was listed
 */
export const PlaylistTracksQueryKey = (playlist: BaseItemDto) => [
	...PlaylistsQueryKey,
	'tracks',
	playlist.Id!,
]
