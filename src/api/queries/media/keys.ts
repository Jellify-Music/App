import { Api } from '@jellyfin/sdk'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'

interface MediaInfoQueryProps {
	api: Api | undefined
	deviceProfile: DeviceProfile | undefined
	itemId: string | null | undefined
}
const MediaInfoQueryKey = ({ api, deviceProfile, itemId }: MediaInfoQueryProps) =>
	[
		'MEDIA_INFO',
		api ? api.configuration.basePath : 'no-api',
		deviceProfile?.Id ?? 'no-device-profile',
		itemId ?? 'no-item-id',
	] as unknown[]

export default MediaInfoQueryKey
