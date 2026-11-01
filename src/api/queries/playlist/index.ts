import { useQuery } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { PlaylistTracksQuery, PublicPlaylistsQuery, UserPlaylistsQuery } from './queries'

export const useUserPlaylists = () => useQuery(UserPlaylistsQuery())

export const usePublicPlaylists = () => useQuery(PublicPlaylistsQuery())

export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const query = PlaylistTracksQuery(playlist)

	return useQuery({ ...query, enabled: query.enabled && !disabled })
}
