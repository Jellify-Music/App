import { Api } from '@jellyfin/sdk'
import { useJellifyContext } from '../../../../src/providers'
import { useQuery } from '@tanstack/react-query'
import { JellifyUser } from '@/src/types/JellifyUser'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import useStreamingDeviceProfile, {
	useDownloadingDeviceProfile,
} from '../../../stores/device-profile'
import { fetchMediaInfo } from './utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

interface MediaInfoQueryProps {
	api: Api | undefined
	user: JellifyUser | undefined
	deviceProfile: DeviceProfile | undefined
	itemId: string | null | undefined
}

const mediaInfoQueryKey = ({ api, user, deviceProfile, itemId }: MediaInfoQueryProps) => [
	api,
	user,
	deviceProfile?.Name,
	itemId,
]

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
	const { api, user } = useJellifyContext()

	const deviceProfile = useStreamingDeviceProfile()

	return useQuery({
		queryKey: mediaInfoQueryKey({ api, user, deviceProfile, itemId }),
		queryFn: () => fetchMediaInfo(api, user, deviceProfile, itemId),
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
	const { api, user } = useJellifyContext()

	const deviceProfile = useDownloadingDeviceProfile()

	return useQuery({
		queryKey: mediaInfoQueryKey({ api, user, deviceProfile, itemId }),
		queryFn: () => fetchMediaInfo(api, user, deviceProfile, itemId),
	})
}
