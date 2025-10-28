import { useMutation } from '@tanstack/react-query'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { Api } from '@jellyfin/sdk'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api'
import { MONOCHROME_ICON_URL } from '../../../configs/config'

const usePostFullCapabilities = () => {
	const streamingDeviceProfile = useStreamingDeviceProfile()

	return useMutation({
		mutationFn: async (api: Api | undefined) => {
			if (!api) return

			return getSessionApi(api).postFullCapabilities({
				clientCapabilitiesDto: {
					IconUrl: MONOCHROME_ICON_URL,
					DeviceProfile: streamingDeviceProfile,
				},
			})
		},
	})
}

export default usePostFullCapabilities
