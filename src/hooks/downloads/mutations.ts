import { useDownloadingDeviceProfileStore } from '../../stores/device-profile'
import { mapDtoToTrack } from '../../utils/mapping/item-to-track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useMutation } from '@tanstack/react-query'
import { DownloadManager, PlayerQueue } from 'react-native-nitro-player'

const useDownloadTracks = () =>
	useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const { deviceProfile } = useDownloadingDeviceProfileStore.getState()

			const playlistId = PlayerQueue.createPlaylist('Context Menu Download')

			const tracks = await Promise.all(
				items.map((item) => mapDtoToTrack(item, deviceProfile, 'download')),
			)

			PlayerQueue.addTracksToPlaylist(playlistId, tracks)

			await DownloadManager.downloadPlaylist(playlistId, tracks)
		},
	})

export const useDeleteDownloads = () =>
	useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const trackIds = items.map((item) => item.Id)
			await Promise.all(trackIds.map((id) => DownloadManager.deleteDownloadedTrack(id!)))
		},
	})

export default useDownloadTracks
