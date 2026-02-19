import { QueryKeys } from '../../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import fetchStorageInUse from './utils/storage-in-use'
import { AUDIO_CACHE_QUERY } from './constants'

type QueryOptions = {
	enabled?: boolean
}

export const useStorageInUse = (options?: QueryOptions) =>
	useQuery({
		queryKey: [QueryKeys.StorageInUse],
		queryFn: fetchStorageInUse,
		enabled: options?.enabled,
	})

export const useAllDownloadedTracks = (options?: QueryOptions) =>
	useQuery({
		...AUDIO_CACHE_QUERY,
		enabled: options?.enabled,
	})

export const useDownloadedTracks = (itemIds: (string | null | undefined)[]) =>
	useAllDownloadedTracks().data?.filter((download) => itemIds.includes(download.item.Id))

export const useDownloadedTrack = (itemId: string | null | undefined) =>
	useDownloadedTracks([itemId])?.at(0)

export const useIsDownloaded = (itemIds: (string | null | undefined)[]) =>
	useDownloadedTracks(itemIds)?.length === itemIds.length && itemIds.length > 0
