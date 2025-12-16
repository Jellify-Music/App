import { BaseItemDto, BaseItemKind, DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyUser } from '../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import { ONE_DAY, queryClient } from '../constants/query-client'
import { QueryKeys } from '../enums/query-keys'
import { fetchMediaInfo } from '../api/queries/media/utils'
import { fetchAlbumDiscsWithAdapter, fetchItemWithAdapter } from '../api/queries/item'
import fetchUserData from '../api/queries/user-data/utils'
import { useRef } from 'react'
import useStreamingDeviceProfile, { useDownloadingDeviceProfile } from '../stores/device-profile'
import UserDataQueryKey from '../api/queries/user-data/keys'
import MediaInfoQueryKey from '../api/queries/media/keys'
import { useApi, useJellifyUser, useAdapter } from '../stores'
import { MusicServerAdapter } from '../api/core/adapter'
import { unifiedTracksToBaseItems } from '../utils/unified-conversions'

export default function useItemContext(): (item: BaseItemDto) => void {
	const api = useApi()
	const [user] = useJellifyUser()
	const adapter = useAdapter()

	const streamingDeviceProfile = useStreamingDeviceProfile()
	const downloadingDeviceProfile = useDownloadingDeviceProfile()

	const prefetchedContext = useRef<Set<string>>(new Set())

	return (item: BaseItemDto) => {
		const effectSig = `${item.Id}-${item.Type}`

		// If we've already warmed the cache for this item, return
		if (prefetchedContext.current.has(effectSig)) return

		// Mark this item's context as warmed, preventing reruns
		prefetchedContext.current.add(effectSig)

		warmItemContext(adapter, api, user, item, streamingDeviceProfile, downloadingDeviceProfile)
	}
}

function warmItemContext(
	adapter: MusicServerAdapter | undefined,
	api: Api | undefined,
	user: JellifyUser | undefined,
	item: BaseItemDto,
	streamingDeviceProfile: DeviceProfile | undefined,
	downloadingDeviceProfile?: DeviceProfile | undefined,
): void {
	const { Id, Type, AlbumId, UserData } = item

	// Fail fast if we don't have an Item ID to work with
	if (!Id) return

	if (Type === BaseItemKind.Audio)
		warmTrackContext(adapter, api, item, streamingDeviceProfile, downloadingDeviceProfile)

	if (Type === BaseItemKind.MusicArtist)
		queryClient.setQueryData([QueryKeys.ArtistById, Id], item)

	if (Type === BaseItemKind.MusicAlbum) warmAlbumContext(adapter, api, item)

	/**
	 * Prefetch query for a playlist's tracks
	 * Uses adapter for both backends
	 */
	if (Type === BaseItemKind.Playlist)
		queryClient.ensureQueryData({
			queryKey: [QueryKeys.ItemTracks, Id, adapter?.backend],
			queryFn: async () => {
				if (!adapter) return []
				const tracks = await adapter.getPlaylistTracks(Id!)
				return unifiedTracksToBaseItems(tracks)
			},
		})

	// User data prefetch - Jellyfin only (Navidrome uses starred list)
	if (adapter?.backend !== 'navidrome') {
		if (queryClient.getQueryState(UserDataQueryKey(user!, item))?.status !== 'success') {
			if (UserData) queryClient.setQueryData(UserDataQueryKey(user!, item), UserData)
			else
				queryClient.ensureQueryData({
					queryKey: UserDataQueryKey(user!, item),
					queryFn: () => fetchUserData(api, user, Id),
				})
		}
	}
}

function warmAlbumContext(
	adapter: MusicServerAdapter | undefined,
	api: Api | undefined,
	album: BaseItemDto,
): void {
	const { Id } = album

	queryClient.setQueryData([QueryKeys.Album, Id], album)

	const albumDiscsQueryKey = [QueryKeys.ItemTracks, Id, adapter?.backend]

	if (queryClient.getQueryState(albumDiscsQueryKey)?.status !== 'success')
		queryClient.ensureQueryData({
			queryKey: albumDiscsQueryKey,
			queryFn: () => fetchAlbumDiscsWithAdapter(adapter, api, album),
		})
}

function warmArtistContext(
	adapter: MusicServerAdapter | undefined,
	api: Api | undefined,
	artistId: string,
): void {
	// Fail fast if we don't have an artist ID to work with
	if (!artistId) return

	const queryKey = [QueryKeys.ArtistById, artistId, adapter?.backend]

	// Bail out if we have data
	if (queryClient.getQueryState(queryKey)?.status === 'success') return

	/**
	 * Store queryable of artist item
	 */
	queryClient.ensureQueryData({
		queryKey,
		queryFn: () => fetchItemWithAdapter(adapter, api, artistId!, 'artist'),
	})
}

function warmTrackContext(
	adapter: MusicServerAdapter | undefined,
	api: Api | undefined,
	track: BaseItemDto,
	streamingDeviceProfile: DeviceProfile | undefined,
	downloadingDeviceProfile: DeviceProfile | undefined,
): void {
	const { Id, AlbumId, ArtistItems } = track

	// Media info prefetch - Jellyfin only (Navidrome doesn't have this concept)
	if (adapter?.backend !== 'navidrome') {
		if (
			queryClient.getQueryState(
				MediaInfoQueryKey({ api, deviceProfile: streamingDeviceProfile, itemId: Id! }),
			)?.status !== 'success'
		)
			queryClient.ensureQueryData({
				queryKey: MediaInfoQueryKey({
					api,
					deviceProfile: streamingDeviceProfile,
					itemId: Id!,
				}),
				queryFn: () => fetchMediaInfo(api, streamingDeviceProfile, Id!),
				staleTime: ONE_DAY,
			})

		const downloadedMediaSourceQueryKey = MediaInfoQueryKey({
			api,
			deviceProfile: downloadingDeviceProfile,
			itemId: Id!,
		})

		if (queryClient.getQueryState(downloadedMediaSourceQueryKey)?.status !== 'success')
			queryClient.ensureQueryData({
				queryKey: downloadedMediaSourceQueryKey,
				queryFn: () => fetchMediaInfo(api, downloadingDeviceProfile, track.Id),
				staleTime: ONE_DAY,
			})
	}

	const albumQueryKey = [QueryKeys.Album, AlbumId, adapter?.backend]

	if (AlbumId && queryClient.getQueryState(albumQueryKey)?.status !== 'success')
		queryClient.ensureQueryData({
			queryKey: albumQueryKey,
			queryFn: () => fetchItemWithAdapter(adapter, api, AlbumId!, 'album'),
		})

	if (ArtistItems)
		ArtistItems.forEach((artistItem) => warmArtistContext(adapter, api, artistItem.Id!))
}
