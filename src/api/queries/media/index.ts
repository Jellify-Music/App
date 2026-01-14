import { Api } from '@jellyfin/sdk'
import { useQuery } from '@tanstack/react-query'
import useStreamingDeviceProfile, {
	useDownloadingDeviceProfile,
} from '../../../stores/device-profile'
import { fetchMediaInfo } from './utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import MediaInfoQueryKey from './keys'
import { getApi } from '../../../stores'

/**
 * A React hook that will retrieve the latest media info
 * for streaming a given track
 *
 * Depends on the {@link useStreamingDeviceProfile} hook for retrieving
 * the currently configured device profile
 *
 * Depends on the {@link getApi} function for retrieving
 * the currently configured {@link Api}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
const useStreamedMediaInfo = (itemId: string | null | undefined) => {
	const api = getApi()

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
 * Depends on the {@link getApi} function for retrieving
 * the currently configured {@link Api}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
export const useDownloadedMediaInfo = (itemId: string | null | undefined) => {
	const api = getApi()

	const deviceProfile = useDownloadingDeviceProfile()

	return useQuery({
		queryKey: MediaInfoQueryKey({ api, deviceProfile, itemId }),
		queryFn: () => fetchMediaInfo(api, deviceProfile, itemId),
		enabled: Boolean(api && deviceProfile && itemId),
		staleTime: Infinity, // Only refetch when the user's device profile changes
		gcTime: Infinity,
	})
}
