import { QueryKeys } from '../../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import fetchStorageInUse from './utils/storage-in-use'
import { getAudioCache } from '../../mutations/download/offlineModeUtils'
import DownloadQueryKeys from './keys'

export const useStorageInUse = () =>
	useQuery({
		queryKey: [QueryKeys.StorageInUse],
		queryFn: fetchStorageInUse,
	})

export const useAllDownloadedTracks = () =>
	useQuery({
		queryKey: [DownloadQueryKeys.DownloadedTracks],
		queryFn: getAudioCache,
		staleTime: Infinity, // Never stale, we will manually refetch when downloads are completed
	})

export const useDownloadedTracks = (itemIds: (string | null | undefined)[]) => {
	const { data: downloadedTracks } = useAllDownloadedTracks()

	const matchingDownloads = downloadedTracks?.filter((download) =>
		itemIds.includes(download.item.Id),
	)

	return matchingDownloads
}

export const useDownloadedTrack = (itemId: string | null | undefined) => {
	const matchingDownloads = useDownloadedTracks([itemId])

	return matchingDownloads ? matchingDownloads[0] : undefined
}

export const useIsDownloaded = (itemIds: (string | null | undefined)[]) =>
	useDownloadedTracks(itemIds)?.length === itemIds.length
