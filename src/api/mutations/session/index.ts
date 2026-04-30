import { useMutation } from '@tanstack/react-query'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api'
import { MONOCHROME_ICON_URL } from '../../../configs/config'
import { useEffect } from 'react'
import { getApi } from '../../../stores'
import { captureError, captureInfo, LoggingContext } from '../../../utils/logging'

const usePostFullCapabilities = () => {
	const api = getApi()
	const streamingDeviceProfile = useStreamingDeviceProfile()

	const { mutate } = useMutation({
		mutationFn: async () => {
			if (!api || api.accessToken === '') return

			return await getSessionApi(api).postFullCapabilities({
				clientCapabilitiesDto: {
					IconUrl: MONOCHROME_ICON_URL,
					DeviceProfile: streamingDeviceProfile,
				},
			})
		},
		onSuccess: () =>
			captureInfo(LoggingContext.Session, 'Successfully posted player capabilities'),
		onError: (error) =>
			captureError(error, LoggingContext.Session, 'Unable to post player capabilities'),
	})

	useEffect(() => {
		mutate()
	}, [streamingDeviceProfile.Id])
}

export default usePostFullCapabilities
