import { Api } from '@jellyfin/sdk'
import MediaInfoQueryKey from './keys'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { fetchMediaInfo } from './utils'

export const MediaInfoQuery = (
	api: Api | undefined,
	deviceProfile: DeviceProfile,
	itemId: string | null | undefined,
) => ({
	queryKey: MediaInfoQueryKey({ api, deviceProfile, itemId }),
	queryFn: () => fetchMediaInfo(api, deviceProfile, itemId),
	enabled: Boolean(api && deviceProfile && itemId),
	staleTime: Infinity, // Only refetch when the user's device profile changes
	gcTime: Infinity,
})
