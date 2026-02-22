import { useDownloadingDeviceProfileStore } from '../../stores/device-profile'
import { mapDtoToTrack } from '../../utils/mapping/item-to-track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { DownloadManager, PlayerQueue } from 'react-native-nitro-player'
import { refetchDownloadsAfterDelay } from './utils'

const useDownloadTracks = () => {
	const download = useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const { deviceProfile } = useDownloadingDeviceProfileStore.getState()

			const playlistId = PlayerQueue.createPlaylist('Context Menu Download')

			const tracks = await Promise.all(
				items.map((item) => mapDtoToTrack(item, deviceProfile, 'download')),
			)

			PlayerQueue.addTracksToPlaylist(playlistId, tracks)

			await DownloadManager.downloadPlaylist(playlistId, tracks)

			// Refetch downloads after a delay to allow the new download to be registered
			refetchDownloadsAfterDelay()
		},
	})

	return {
		mutate: download.mutate,
		isPending: download.isPending,
	}
}

export const useDeleteDownloads = () => {
	const deleteDownloads = useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const trackIds = items.map((item) => item.Id)
			await Promise.all(trackIds.map((id) => DownloadManager.deleteDownloadedTrack(id!)))
		},
		onSettled: refetchDownloadsAfterDelay,
	})

	return {
		mutate: deleteDownloads.mutate,
		isPending: deleteDownloads.isPending,
	}
}

export default useDownloadTracks
