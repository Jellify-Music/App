import { mapDtoToTrack } from '../../utils/mapping/item-to-track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { DownloadedTrack, DownloadManager, PlayerQueue } from 'react-native-nitro-player'
import { queryClient } from '../../constants/query-client'
import ALL_DOWNLOADS_KEY from './keys'
import resolveTrackUrls from '../../utils/fetching/track-media-info'

const useDownloadTracks = () =>
	useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const playlistId = PlayerQueue.createPlaylist('Context Menu Download')

			const tracks = items.map((item) => mapDtoToTrack(item))

			const resolvedTracks = await resolveTrackUrls(tracks, 'download')

			PlayerQueue.addTracksToPlaylist(playlistId, resolvedTracks)

			await Promise.all(resolvedTracks.map((track) => DownloadManager.downloadTrack(track)))

			console.debug(`Downloaded ${resolvedTracks.length} tracks from ${items.length} items`)
		},
	})

export const useDeleteDownloads = () => {
	const deleteDownloads = useMutation({
		mutationFn: async (itemIds: string[]) => {
			await Promise.all(itemIds.map((id) => DownloadManager.deleteDownloadedTrack(id!)))
		},
		onSuccess: (_, items) => {
			queryClient.setQueryData(
				ALL_DOWNLOADS_KEY,
				(oldData: DownloadedTrack[] | undefined) => {
					if (!oldData) return []
					return oldData.filter(
						(download) => !items.some((itemId) => itemId === download.trackId),
					)
				},
			)
		},
	})

	return {
		mutate: deleteDownloads.mutate,
		isPending: deleteDownloads.isPending,
	}
}

export default useDownloadTracks
