import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type DeviceProfileStore = {
	deviceProfile: DeviceProfile
	setDeviceProfile: (data: DeviceProfile) => void
}

export const useStreamingDeviceProfileStore = create<DeviceProfileStore>()(
	devtools(
		persist(
			(set) => ({
				deviceProfile: {},
				setDeviceProfile: (data: DeviceProfile) => set({ deviceProfile: data }),
			}),
			{
				name: 'streaming-device-profile-storage',
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
				deviceProfile: {},
				setDeviceProfile: (data: DeviceProfile) => set({ deviceProfile: data }),
			}),
			{
				name: 'downloading-device-profile-storage',
			},
		),
	),
)

export const useDownloadingDeviceProfile = () => {
	return useDownloadingDeviceProfileStore((state) => state.deviceProfile)
}
