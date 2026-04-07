import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyUser } from '../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import { ONE_DAY, ONE_HOUR, ONE_MINUTE, queryClient } from '../constants/query-client'
import { QueryKeys } from '../enums/query-keys'
import { fetchAlbumDiscs, fetchItem } from '../api/queries/item'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import fetchUserData from '../api/queries/user-data/utils'
import UserDataQueryKey from '../api/queries/user-data/keys'
import { getApi, getUser } from '../stores'
import { ArtistQueryKey } from '../api/queries/artist/keys'
import { AlbumQuery } from '../api/queries/album/queries'

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

	if (Type === BaseItemKind.Audio) warmTrackContext(api, item)

	if (Type === BaseItemKind.MusicArtist) queryClient.setQueryData(ArtistQueryKey(Id), item)

	if (Type === BaseItemKind.MusicAlbum) warmAlbumContext(api, item)

	/**
	 * Prefetch query for a playlist's tracks
	 *
	 * Referenced later in the context sheet
	 */
	if (Type === BaseItemKind.Playlist)
		queryClient.ensureQueryData({
			queryKey: [QueryKeys.ItemTracks, Id],
			queryFn: () =>
				getItemsApi(api)
					.getItems({ parentId: Id! })
					.then(({ data }) => {
						if (data.Items) return data.Items
						else return []
					}),
			staleTime: ONE_HOUR,
		})

	queryClient.ensureQueryData({
		queryKey: UserDataQueryKey(user, item.Id!),
		queryFn: () => fetchUserData(Id),
		staleTime: ONE_MINUTE * 15,
	})
}

function warmAlbumContext(api: Api | undefined, album: BaseItemDto): void {
	const { Id } = album

	queryClient.setQueryData([QueryKeys.Album, Id], album)

	const albumDiscsQueryKey = [QueryKeys.ItemTracks, Id]

	if (queryClient.getQueryState(albumDiscsQueryKey)?.status !== 'success')
		queryClient.ensureQueryData({
			queryKey: albumDiscsQueryKey,
			queryFn: () => fetchAlbumDiscs(api, album),
			staleTime: ONE_DAY,
		})
}

function warmArtistContext(api: Api | undefined, artistId: string): void {
	// Fail fast if we don't have an artist ID to work with
	if (!artistId) return

	// ensureQueryData respects staleTime internally — no need to check getQueryState first
	queryClient.ensureQueryData({
		queryKey: ArtistQueryKey(artistId),
		queryFn: () => fetchItem(api, artistId),
		staleTime: ONE_DAY,
	})
}

function warmTrackContext(api: Api | undefined, track: BaseItemDto): void {
	const { AlbumId, ArtistItems } = track

	if (AlbumId) queryClient.ensureQueryData(AlbumQuery({ Id: AlbumId } as BaseItemDto))

	if (ArtistItems) ArtistItems.forEach((artistItem) => warmArtistContext(api, artistItem.Id!))
}
