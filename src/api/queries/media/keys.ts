import { Api } from '@jellyfin/sdk'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'

interface MediaInfoQueryProps {
	api: Api | undefined
	deviceProfile: DeviceProfile | undefined
	itemId: string | null | undefined
}
const MediaInfoQueryKey = ({ api, deviceProfile, itemId }: MediaInfoQueryProps) => [
	'MEDIA_INFO',
	api,
	deviceProfile?.Id,
	itemId,
]

export default MediaInfoQueryKey
