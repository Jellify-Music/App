import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyUser } from '../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import { queryClient } from '../constants/query-client'
import { QueryKeys } from '../enums/query-keys'
import { getQualityParams } from '../utils/mappings'
import { fetchMediaInfo } from '../api/queries/media'
import { StreamingQuality, useStreamingQualityContext } from '../providers/Settings'
import { fetchAlbumDiscs, fetchItem } from '../api/queries/item'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { fetchUserData } from '../api/queries/favorites'
import { useJellifyContext } from '../providers'
import { useEffect, useRef } from 'react'

export default function useItemContext(item: BaseItemDto): void {
	const { api, user } = useJellifyContext()

	const streamingQuality = useStreamingQualityContext()

	const prefetchedContext = useRef<Set<string>>(new Set())

	useEffect(() => {
		const effectSig = `${item.Id}-${item.Type}`

		// If we've already warmed the cache for this item, return
		if (prefetchedContext.current.has(effectSig)) return

		// Mark this item's context as warmed, preventing reruns
		prefetchedContext.current.add(effectSig)

		warmItemContext(api, user, item, streamingQuality)
	}, [api, user, streamingQuality])
}

export function warmArtistContext(api: Api | undefined, artistId: string): void {
	// Fail fast if we don't have an artist ID to work with
	if (!artistId) return

	const queryKey = [QueryKeys.ArtistById, artistId]

	// Bail out if we have data
	if (queryClient.getQueryState(queryKey)?.status === 'success') return

	console.debug(`Warming context cache for artist ${artistId}`)
	/**
	 * Store queryable of artist item
	 */
	queryClient.ensureQueryData({
		queryKey,
		queryFn: () => fetchItem(api, artistId!),
	})
}

export function warmItemContext(
	api: Api | undefined,
	user: JellifyUser | undefined,
	item: BaseItemDto,
	streamingQuality: StreamingQuality,
): void {
	const { Id, Type, AlbumId, UserData } = item

	// Fail fast if we don't have an Item ID to work with
	if (!Id) return

	console.debug(`Warming context query cache for item ${Id}`)

	if (Type === BaseItemKind.Audio) {
		const mediaSourcesQueryKey = [QueryKeys.MediaSources, streamingQuality, Id]

		if (queryClient.getQueryState(mediaSourcesQueryKey)?.status !== 'success')
			queryClient.ensureQueryData({
				queryKey: mediaSourcesQueryKey,
				queryFn: () => fetchMediaInfo(api, user, getQualityParams(streamingQuality), Id),
			})

		const albumQueryKey = [QueryKeys.Album, AlbumId]

		if (AlbumId)
			queryClient.ensureQueryData({
				queryKey: albumQueryKey,
				queryFn: () => fetchItem(api, AlbumId!),
			})
	}

	if (Type === BaseItemKind.MusicArtist)
		queryClient.setQueryData([QueryKeys.ArtistById, Id], item)

	if (Type === BaseItemKind.MusicAlbum) {
		queryClient.setQueryData([QueryKeys.Album, Id], item)

		const albumDiscsQueryKey = [QueryKeys.ItemTracks, Id]

		if (queryClient.getQueryState(albumDiscsQueryKey)?.status !== 'success')
			queryClient.ensureQueryData({
				queryKey: albumDiscsQueryKey,
				queryFn: () => fetchAlbumDiscs(api, item),
			})
	}

	/**
	 * Prefetch query for a playlist's tracks
	 *
	 * Referenced later in the context sheet
	 */
	if (Type === BaseItemKind.Playlist)
		queryClient.ensureQueryData({
			queryKey: [QueryKeys.ItemTracks, Id],
			queryFn: () =>
				getItemsApi(api!)
					.getItems({ parentId: Id! })
					.then(({ data }) => {
						if (data.Items) return data.Items
						else return []
					}),
		})

	if (UserData) queryClient.setQueryData([QueryKeys.UserData, Id], UserData)
	else
		queryClient.ensureQueryData({
			queryKey: [QueryKeys.UserData, Id],
			queryFn: () => fetchUserData(api, user, Id),
		})
}
