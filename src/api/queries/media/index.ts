import { Api } from '@jellyfin/sdk'
import { useQuery } from '@tanstack/react-query'
import useStreamingDeviceProfile, {
	useDownloadingDeviceProfile,
} from '../../../stores/device-profile'
import { fetchMediaInfo } from './utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import MediaInfoQueryKey from './keys'
import { useApi } from '../../../stores'
import { ONE_DAY, ONE_HOUR } from '../../../constants/query-client'

/**
 * A React hook that will retrieve the latest media info
 * for streaming a given track
 *
 * Depends on the {@link useStreamingDeviceProfile} hook for retrieving
 * the currently configured device profile
 *
 * Depends on the {@link useApi} hook for retrieving
 * the currently configured {@link Api}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
const useStreamedMediaInfo = (itemId: string | null | undefined) => {
	const api = useApi()

	const deviceProfile = useStreamingDeviceProfile()

	return useQuery({
		queryKey: MediaInfoQueryKey({ api, deviceProfile, itemId }),
		queryFn: () => fetchMediaInfo(api, deviceProfile, itemId),
		enabled: Boolean(api && deviceProfile && itemId),
		staleTime: Infinity, // Only refetch when the user's device profile changes
		gcTime: Infinity,
	})
}

export default useStreamedMediaInfo

/**
 * A React hook that will retrieve the latest media info
 * for downloading a given track
 *
 * Depends on the {@link useDownloadingDeviceProfile} hook for retrieving
 * the currently configured device profile
 *
 * Depends on the {@link useApi} hook for retrieving
 * the currently configured {@link Api}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
export const useDownloadedMediaInfo = (itemId: string | null | undefined) => {
	const api = useApi()

	const deviceProfile = useDownloadingDeviceProfile()

	return useQuery({
		queryKey: MediaInfoQueryKey({ api, deviceProfile, itemId }),
		queryFn: () => fetchMediaInfo(api, deviceProfile, itemId),
		enabled: Boolean(api && deviceProfile && itemId),
		staleTime: ONE_HOUR * 6, // Only refetch when the user's device profile changes
		gcTime: ONE_HOUR * 6,
	})
}
