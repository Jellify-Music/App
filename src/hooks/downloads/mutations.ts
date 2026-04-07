import { useMutation } from '@tanstack/react-query'
import { DownloadedTrack, DownloadManager } from 'react-native-nitro-player'
import { queryClient } from '../../constants/query-client'
import ALL_DOWNLOADS_KEY from './keys'
import { downloadItems } from './functions'

const useDownloadTracks = () =>
	useMutation({
		mutationFn: downloadItems,
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
		mutateAsync: deleteDownloads.mutateAsync,
		isPending: deleteDownloads.isPending,
	}
}

export default useDownloadTracks
