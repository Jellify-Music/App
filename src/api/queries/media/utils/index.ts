import { Api } from '@jellyfin/sdk'
import { DeviceProfile, PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { nitroFetch } from '../../../utils/nitro'

export async function fetchMediaInfo(
	api: Api | undefined,
	deviceProfile: DeviceProfile | undefined,
	itemId: string | null | undefined,
): Promise<PlaybackInfoResponse> {
	console.debug(`Fetching media info of with ${deviceProfile?.Name} profile`)

	if (isUndefined(api)) throw new Error('Client instance not set')

	return nitroFetch<PlaybackInfoResponse>(
		api,
		`/Items/${itemId}/PlaybackInfo`,
		undefined,
		'POST',
		{
			DeviceProfile: deviceProfile,
		},
	)
}
