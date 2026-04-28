import { Api } from '@jellyfin/sdk'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'

interface MediaInfoQueryProps {
	api: Api | undefined
	deviceProfile: DeviceProfile
	itemId: string | null | undefined
}
const MediaInfoQueryKey = ({ api, deviceProfile, itemId }: MediaInfoQueryProps) =>
	[
		'MEDIA_INFO',
		api ? api.configuration.basePath : 'no-api',
		deviceProfile.Id!,
		itemId ?? 'no-item-id',
	] as unknown[]

export default MediaInfoQueryKey
