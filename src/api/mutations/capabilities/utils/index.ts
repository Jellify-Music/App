import { MONOCHROME_ICON_URL } from '../../../../configs/config'
import { getApi } from '../../../../stores/auth/utils'
import { LoggingContext, captureError } from '../../../../utils/logging'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api'
import type { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'

/**
 * Reports the full capabilities of the device to the server, including the device profile and icon URL.
 * @param deviceProfile The device profile to report capabilities for.
 *
 * Fire-and-forget: does nothing when there's no authenticated API client, and logs
 * its own failures rather than rejecting.
 */
export function postFullCapabilities(deviceProfile: DeviceProfile): void {
	const api = getApi()

	if (api && api.accessToken !== '') {
		getSessionApi(api)
			.postFullCapabilities({
				clientCapabilitiesDto: {
					IconUrl: MONOCHROME_ICON_URL,
					DeviceProfile: deviceProfile,
				},
			})
			.catch((error) => {
				captureError(
					error,
					LoggingContext.PlaybackReporting,
					'Failed to report player capabilities.',
				)
			})
	}
}
