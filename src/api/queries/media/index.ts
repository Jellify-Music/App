import { Api } from '@jellyfin/sdk'
import { useJellifyContext } from '../../../../src/providers'
import { useQuery } from '@tanstack/react-query'
import { JellifyUser } from '@/src/types/JellifyUser'
import useStreamingDeviceProfile, {
	useDownloadingDeviceProfile,
} from '../../../stores/device-profile'
import { fetchMediaInfo } from './utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import MediaInfoQueryKey from './keys'

/**
 * A React hook that will retrieve the latest media info
 * for streaming a given track
 *
 * Depends on the {@link useStreamingDeviceProfile} hook for retrieving
 * the currently configured device profile
 *
 * Depends on the {@link useJellifyContext} hook for retrieving
 * the currently configured {@link Api} and {@link JellifyUser}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
const useStreamedMediaInfo = (itemId: string | null | undefined) => {
	const { api } = useJellifyContext()

	const deviceProfile = useStreamingDeviceProfile()

	return useQuery({
		queryKey: MediaInfoQueryKey({ api, deviceProfile, itemId }),
		queryFn: () => fetchMediaInfo(api, deviceProfile, itemId),
		staleTime: Infinity, // Only refetch when the user's device profile changes
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
 * Depends on the {@link useJellifyContext} hook for retrieving
 * the currently configured {@link Api} and {@link JellifyUser}
 * instance
 *
 * @param itemId The Id of the {@link BaseItemDto}
 * @returns
 */
export const useDownloadedMediaInfo = (itemId: string | null | undefined) => {
	const { api } = useJellifyContext()

	const deviceProfile = useDownloadingDeviceProfile()

	return useQuery({
		queryKey: MediaInfoQueryKey({ api, deviceProfile, itemId }),
		queryFn: () => fetchMediaInfo(api, deviceProfile, itemId),
		staleTime: Infinity, // Only refetch when the user's device profile changes
	})
}
