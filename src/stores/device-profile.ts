import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../constants/storage'
import { getDeviceProfile } from '../utils/audio/device-profiles'
import StreamingQuality from '../enums/audio-quality'
import { getApi } from '.'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api'
import { MONOCHROME_ICON_URL } from '../configs/config'
import { captureError, captureInfo, LoggingContext } from '../utils/logging'

type DeviceProfileStore = {
	deviceProfile: DeviceProfile
	setDeviceProfile: (data: DeviceProfile) => void
}

export const useStreamingDeviceProfileStore = create<DeviceProfileStore>()(
	devtools(
		persist(
			(set) => ({
				deviceProfile: getDeviceProfile(StreamingQuality.Original, 'stream'),
				setDeviceProfile: (data: DeviceProfile) => {
					set({ deviceProfile: data })

					// Post updated capabilities to the server whenever the device profile changes
					const api = getApi()
					if (api && api.accessToken !== '') {
						getSessionApi(api)
							.postFullCapabilities({
								clientCapabilitiesDto: {
									IconUrl: MONOCHROME_ICON_URL,
									DeviceProfile: data,
								},
							})
							.then(() => {
								captureInfo(
									LoggingContext.PlaybackReporting,
									'Successfully reported player capabilities after device profile update.',
								)
							})
							.catch((error) => {
								captureError(
									error,
									LoggingContext.PlaybackReporting,
									'Failed to report player capabilities after device profile update.',
								)
							})
					}
				},
			}),
			{
				name: 'streaming-device-profile-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
				onRehydrateStorage: ({ deviceProfile }) => {
					// Post capabilities on app start to ensure the server has the latest profile
					const api = getApi()
					if (api && api.accessToken !== '') {
						getSessionApi(api).postFullCapabilities({
							clientCapabilitiesDto: {
								IconUrl: MONOCHROME_ICON_URL,
								DeviceProfile: deviceProfile,
							},
						})
					}
				},
			},
		),
	),
)

const useStreamingDeviceProfile = () => {
	return useStreamingDeviceProfileStore((state) => state.deviceProfile)
}

export default useStreamingDeviceProfile

export const useDownloadingDeviceProfileStore = create<DeviceProfileStore>()(
	devtools(
		persist(
			(set) => ({
				deviceProfile: getDeviceProfile(StreamingQuality.Original, 'download'),
				setDeviceProfile: (data: DeviceProfile) => {
					set({ deviceProfile: data })
				},
			}),
			{
				name: 'downloading-device-profile-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const useDownloadingDeviceProfile = () => {
	return useDownloadingDeviceProfileStore((state) => state.deviceProfile)
}
