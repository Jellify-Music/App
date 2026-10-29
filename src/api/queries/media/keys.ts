import { Api } from '@jellyfin/sdk'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'

enum MediaInfoQueryKeys {
	MediaInfo = 'POSTED_PLAYBACK_INFO',
}

interface MediaInfoQueryProps {
	api: Api | undefined
	deviceProfile: DeviceProfile
	itemId: string | null | undefined
}
const MediaInfoQueryKey = ({ api, deviceProfile, itemId }: MediaInfoQueryProps) => [
	MediaInfoQueryKeys.MediaInfo,
	api ? api.configuration.basePath : 'no-api',
	deviceProfile.Id!,
	itemId ?? 'no-item-id',
]

export default MediaInfoQueryKey
