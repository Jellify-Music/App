import { getAudioCache } from '../../../mutations/download/offlineModeUtils'
import DownloadQueryKeys from '../keys'

export const AUDIO_CACHE_QUERY = {
	queryKey: [DownloadQueryKeys.DownloadedTracks],
	queryFn: getAudioCache,
	staleTime: Infinity, // Never stale, we will manually refetch when downloads are completed
}
