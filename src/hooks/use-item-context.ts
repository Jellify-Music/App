import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyUser } from '../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import { prefetchPlaylistTracks } from '../api/queries/playlist/cache'
import { queryClient } from '../api/client'
import { QueryKeys } from '../enums/query-keys'
import fetchUserData from '../api/queries/user-data/utils'
import UserDataQueryKey from '../api/queries/user-data/keys'
import { getApi, getUser } from '../stores/auth/utils'
import { ArtistQueryKey } from '../api/queries/artist/keys'
import { AlbumQuery } from '../api/queries/album/queries'
import { prefetchAlbumDiscsQuery } from '../api/queries/album'
import { QueryAges } from '../constants/durations'
import { prefetchArtistQueryData } from '../api/queries/artist/cache'

// Module-level dedup guard — no hook needed, this is just a long-lived Set
const prefetchedContext = new Set<string>()

export default function useItemContext(): (item: BaseItemDto) => void {
	return (item: BaseItemDto) => {
		const effectSig = `${item.Id}-${item.Type}`

		// If we've already warmed the cache for this item, return
		if (prefetchedContext.has(effectSig)) return

		// Mark this item's context as warmed, preventing reruns
		prefetchedContext.add(effectSig)

		// Read api/user inside the callback so they're only resolved when actually needed
		const api = getApi()
		const user = getUser()

		warmItemContext(api, user, item)
	}
}

function warmItemContext(
	api: Api | undefined,
	user: JellifyUser | undefined,
	item: BaseItemDto,
): void {
	const { Id, Type } = item

	// Fail fast if we don't have an Item ID to work with
	if (!Id || !api || !user) return

	if (Type === BaseItemKind.Audio) warmTrackContext(item)

	if (Type === BaseItemKind.MusicArtist) queryClient.setQueryData(ArtistQueryKey(Id), item)

	if (Type === BaseItemKind.MusicAlbum) warmAlbumContext(api, item)

	/**
	 * Prefetch query for a playlist's tracks
	 *
	 * Referenced later in the context sheet
	 */
	if (Type === BaseItemKind.Playlist) prefetchPlaylistTracks(item)

	queryClient
		.query({
			queryKey: UserDataQueryKey(user, item.Id!),
			queryFn: () => fetchUserData(Id),
			staleTime: QueryAges.OneMinute * 15,
		})
		.catch(() => {})
}

function warmAlbumContext(api: Api | undefined, album: BaseItemDto): void {
	const { Id } = album

	queryClient.setQueryData([QueryKeys.Album, Id], album)

	prefetchAlbumDiscsQuery(album)
}

function warmArtistContext(artistId: BaseItemDto['Id']): void {
	// Fail fast if we don't have an artist ID to work with
	if (!artistId) return

	prefetchArtistQueryData(artistId)
}

function warmTrackContext(track: BaseItemDto): void {
	const { AlbumId, ArtistItems } = track

	if (AlbumId) queryClient.query(AlbumQuery({ Id: AlbumId } as BaseItemDto)).catch(() => {})

	if (ArtistItems) ArtistItems.forEach((artistItem) => warmArtistContext(artistItem.Id))
}
