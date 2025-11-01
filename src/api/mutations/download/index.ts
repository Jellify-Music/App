import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useDownloadingDeviceProfile } from '../../../stores/device-profile'
import { UseMutateFunction, useMutation } from '@tanstack/react-query'
import { mapDtoToTrack } from '../../../utils/mappings'
import { deleteAudio, saveAudio } from './offlineModeUtils'
import { useState } from 'react'
import { JellifyDownloadProgress } from '../../../types/JellifyDownload'
import { useAllDownloadedTracks } from '../../queries/download'
import { useApi } from '../../../stores'

export const useDownloadAudioItem: () => [
	JellifyDownloadProgress,
	UseMutateFunction<boolean, Error, { item: BaseItemDto; autoCached: boolean }, void>,
] = () => {
	const api = useApi()

	const { data: downloadedTracks, refetch } = useAllDownloadedTracks()

	const deviceProfile = useDownloadingDeviceProfile()

	const [downloadProgress, setDownloadProgress] = useState<JellifyDownloadProgress>({})

	return [
		downloadProgress,
		useMutation({
			onMutate: () => console.debug('Downloading audio track from Jellyfin'),
			mutationFn: async ({
				item,
				autoCached,
			}: {
				item: BaseItemDto
				autoCached: boolean
			}) => {
				if (!api) return Promise.reject('API Instance not set')

				// If we already have this track downloaded, resolve the promise
				if (
					downloadedTracks?.filter((download) => download.item.Id === item.Id).length ??
					0 > 0
				)
					return Promise.resolve(false)

				const track = mapDtoToTrack(api, item, downloadedTracks ?? [], deviceProfile)

				return saveAudio(track, setDownloadProgress, autoCached)
			},
			onError: (error) =>
				console.error('Downloading audio track from Jellyfin failed', error),
			onSuccess: (data) =>
				console.error(
					`${data ? 'Downloaded' : 'Did not download'} audio track from Jellyfin`,
				),
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
		onSuccess: (_, itemIds) =>
			console.debug(`Successfully deleted ${itemIds.length} downloads`),
		onSettled: () => refetch(),
	}).mutate
}
