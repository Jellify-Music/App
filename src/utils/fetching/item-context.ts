import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyUser } from '../../types/JellifyUser'
import { prefetchPlaylistTracks } from '../../api/queries/playlist/cache'
import { queryClient } from '../../api/client'
import fetchUserData from '../../api/queries/user-data/utils'
import UserDataQueryKey from '../../api/queries/user-data/keys'
import { getApi, getUser } from '../../stores/auth/utils'
import { ArtistQueryKey } from '../../api/queries/artist/keys'
import { AlbumQuery } from '../../api/queries/album/queries'
import { AlbumQueryKey } from '../../api/queries/album/keys'
import { prefetchAlbumDiscsQuery } from '../../api/queries/album'
import { QueryAges } from '../../constants/durations'
import { prefetchArtistQueryData } from '../../api/queries/artist/cache'

// Module-level dedup guard so each item's context is only warmed once
const prefetchedContext = new Set<string>()

/**
 * Warms the query cache with data the item's screen and context sheet will need.
 *
 * Safe to call repeatedly (e.g. on every press-in) — subsequent calls for the
 * same item are no-ops.
 */
export default function warmItemContext(item: BaseItemDto): void {
	const effectSig = `${item.Id}-${item.Type}`

	// If we've already warmed the cache for this item, return
	if (prefetchedContext.has(effectSig)) return

	// Read api/user at call time so they're only resolved when actually needed
	const api = getApi()
	const user = getUser()

	// Don't mark as warmed until we're actually able to warm it
	if (!item.Id || !api || !user) return

	// Mark this item's context as warmed, preventing reruns
	prefetchedContext.add(effectSig)

	warmContext(user, item)
}

function warmContext(user: JellifyUser, item: BaseItemDto): void {
	const { Id, Type } = item

	if (Type === BaseItemKind.Audio) warmTrackContext(item)

	if (Type === BaseItemKind.MusicArtist) queryClient.setQueryData(ArtistQueryKey(Id!), item)

	if (Type === BaseItemKind.MusicAlbum) warmAlbumContext(item)

	/**
	 * Prefetch query for a playlist's tracks
	 *
	 * Referenced later in the context sheet
	 */
	if (Type === BaseItemKind.Playlist) prefetchPlaylistTracks(item)

	queryClient
		.query({
			queryKey: UserDataQueryKey(user, Id!),
			queryFn: () => fetchUserData(Id!),
			staleTime: QueryAges.OneMinute * 15,
		})
		.catch(() => {})
}

function warmAlbumContext(album: BaseItemDto): void {
	queryClient.setQueryData(AlbumQueryKey(album), album)

	prefetchAlbumDiscsQuery(album)

	album.ArtistItems?.forEach((artistItem) => warmArtistContext(artistItem.Id))
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
