import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useDownloadingDeviceProfile } from '../../../stores/device-profile'
import { UseMutateFunction, useMutation } from '@tanstack/react-query'
import { mapDtoToTrack } from '../../../utils/mappings'
import { deleteAudio, saveAudio } from './offlineModeUtils'
import { useState, useRef } from 'react'
import { JellifyDownloadProgress } from '../../../types/JellifyDownload'
import { useAllDownloadedTracks } from '../../queries/download'
import { useApi, useAdapter, useJellifyServer } from '../../../stores'
import { QueuingType } from '../../../enums/queuing-type'

export const useDownloadAudioItem: () => [
	JellifyDownloadProgress,
	UseMutateFunction<boolean, Error, { item: BaseItemDto; autoCached: boolean }, void>,
] = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [server] = useJellifyServer()

	// Use refs to avoid stale closure issues after sign-in/sign-out
	const apiRef = useRef(api)
	const adapterRef = useRef(adapter)
	const serverRef = useRef(server)
	apiRef.current = api
	adapterRef.current = adapter
	serverRef.current = server

	const { data: downloadedTracks, refetch } = useAllDownloadedTracks()

	const deviceProfile = useDownloadingDeviceProfile()

	const [downloadProgress, setDownloadProgress] = useState<JellifyDownloadProgress>({})

	return [
		downloadProgress,
		useMutation({
			onMutate: () => {},
			mutationFn: async ({
				item,
				autoCached,
			}: {
				item: BaseItemDto
				autoCached: boolean
			}) => {
				// Get current values from refs to avoid stale closures
				const currentApi = apiRef.current
				const currentAdapter = adapterRef.current
				const currentServer = serverRef.current

				// If we already have this track downloaded, resolve the promise
				if (
					downloadedTracks?.filter((download) => download.item.Id === item.Id).length ??
					0 > 0
				)
					return Promise.resolve(false)

				// For Navidrome, use the adapter to create the track with proper URLs
				if (currentServer?.backend === 'navidrome' && currentAdapter && item.Id) {
					// Convert BaseItemDto to unified track format
					const unifiedTrack = {
						id: item.Id,
						name: item.Name ?? 'Unknown',
						albumId: item.AlbumId ?? '',
						albumName: item.Album ?? '',
						artistId: item.ArtistItems?.[0]?.Id ?? '',
						artistName: item.Artists?.join(' • ') ?? '',
						duration: item.RunTimeTicks ? item.RunTimeTicks / 10_000_000 : 0,
						trackNumber: item.IndexNumber ?? undefined,
						discNumber: item.ParentIndexNumber ?? undefined,
						coverArtId: item.AlbumId ?? item.Id,
					}

					// Get track with stream URL, then override with download URL
					const track = currentAdapter.mapToJellifyTrack(
						unifiedTrack,
						QueuingType.DirectlyQueued,
					)
					// Use download.view instead of stream.view for actual file download
					track.url = currentAdapter.getDownloadUrl(item.Id)

					return saveAudio(track, setDownloadProgress, autoCached)
				}

				// For Jellyfin, use the existing mapper
				if (!currentApi) return Promise.reject('API Instance not set')

				const track = mapDtoToTrack(currentApi, item, deviceProfile)

				return saveAudio(track, setDownloadProgress, autoCached)
			},
			onError: (error) => console.error('Downloading audio track failed', error),
			onSuccess: (data) =>
				console.log(`${data ? 'Downloaded' : 'Did not download'} audio track`),
			onSettled: () => refetch(),
		}).mutate,
	]
}

export const useClearAllDownloads = () => {
	const { data: downloadedTracks, refetch: refetchDownloadedTracks } = useAllDownloadedTracks()

	return useMutation({
		mutationFn: async () => {
			return downloadedTracks?.forEach((track) => {
				deleteAudio(track.item.Id)
			})
		},
		onSuccess: () => {
			refetchDownloadedTracks()
		},
	}).mutate
}

export const useDeleteDownloads = () => {
	const { refetch } = useAllDownloadedTracks()

	return useMutation({
		mutationFn: async (itemIds: (string | undefined | null)[]) => {
			itemIds.forEach((Id) => deleteAudio(Id))
		},
		onError: (error, itemIds) =>
			console.error(`Unable to delete ${itemIds.length} downloads`, error),
		onSuccess: (_, itemIds) => {},
		onSettled: () => refetch(),
	}).mutate
}
