import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { stateStorage } from '../constants/storage'
import { getDeviceProfile } from '../utils/device-profiles'
import StreamingQuality from '../enums/audio-quality'

type DeviceProfileStore = {
	deviceProfile: DeviceProfile
	setDeviceProfile: (data: DeviceProfile) => void
}

export const useStreamingDeviceProfileStore = create<DeviceProfileStore>()(
	devtools(
		persist(
			(set) => ({
				deviceProfile: getDeviceProfile(StreamingQuality.Original, 'stream'),
				setDeviceProfile: (data: DeviceProfile) => set({ deviceProfile: data }),
			}),
			{
				name: 'streaming-device-profile-storage',
				storage: createJSONStorage(() => stateStorage),
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
				setDeviceProfile: (data: DeviceProfile) => set({ deviceProfile: data }),
			}),
			{
				name: 'downloading-device-profile-storage',
				storage: createJSONStorage(() => stateStorage),
			},
		),
	),
)

export const useDownloadingDeviceProfile = () => {
	return useDownloadingDeviceProfileStore((state) => state.deviceProfile)
}
