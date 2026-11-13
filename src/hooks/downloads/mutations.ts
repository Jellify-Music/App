import { useMutation } from '@tanstack/react-query'
import { DownloadedTrack, DownloadManager } from 'react-native-nitro-player'
import { queryClient } from '../../api/client'
import ALL_DOWNLOADS_KEY from './keys'
import { downloadItems } from './functions'
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'

const useDownloadTracks = () =>
	useMutation({
		mutationFn: downloadItems,
		onError: (error) => handleError(error, LoggingContext.Downloads, 'Failed to download'),
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
		onError: (error) =>
			handleError(error, LoggingContext.Downloads, 'Failed to remove downloads'),
	})

	return {
		mutate: deleteDownloads.mutate,
		mutateAsync: deleteDownloads.mutateAsync,
		isPending: deleteDownloads.isPending,
	}
}

export default useDownloadTracks
