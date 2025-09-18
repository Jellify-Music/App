import { QueryKeys } from '../../../enums/query-keys'
import { useQuery } from '@tanstack/react-query'
import fetchStorageInUse from './utils/storage-in-use'
import { getAudioCache } from '../../mutations/download/offlineModeUtils'
import DownloadQueryKeys from './keys'
import { AUDIO_CACHE_QUERY } from './constants'

export const useStorageInUse = () =>
	useQuery({
		queryKey: [QueryKeys.StorageInUse],
		queryFn: fetchStorageInUse,
	})

export const useAllDownloadedTracks = () => useQuery(AUDIO_CACHE_QUERY)

export const useDownloadedTracks = (itemIds: (string | null | undefined)[]) =>
	useAllDownloadedTracks().data?.filter((download) => itemIds.includes(download.item.Id))

export const useDownloadedTrack = (itemId: string | null | undefined) =>
	useDownloadedTracks([itemId])?.at(0)

export const useIsDownloaded = (itemIds: (string | null | undefined)[]) =>
	useDownloadedTracks(itemIds)?.length === itemIds.length
