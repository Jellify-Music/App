import { useMutation } from '@tanstack/react-query'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api'
import { MONOCHROME_ICON_URL } from '../../../configs/config'
import { useEffect } from 'react'
import { useApi } from '../../../stores'

const usePostFullCapabilities = () => {
	const api = useApi()
	const streamingDeviceProfile = useStreamingDeviceProfile()

	const { mutate } = useMutation({
		onMutate: () => console.debug('Posting player capabilities'),
		mutationFn: async () => {
			if (!api) return

			return await getSessionApi(api).postFullCapabilities({
				clientCapabilitiesDto: {
					IconUrl: MONOCHROME_ICON_URL,
					DeviceProfile: streamingDeviceProfile,
				},
			})
		},
		onSuccess: () => console.info('Successfully posted player capabilities'),
		onError: (error) => console.error('Unable to post player capabilities', error),
	})

	useEffect(() => {
		mutate()
	}, [streamingDeviceProfile.Id])
}

export default usePostFullCapabilities
