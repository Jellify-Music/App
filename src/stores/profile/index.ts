import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../../constants/storage'
import { getDeviceProfile } from '../../utils/audio/device-profiles'
import { StreamingQuality } from '../../enums/audio-quality'
import { DeviceProfileStore } from './types'
import { setStreamingDeviceProfile } from './utils/set'
import { onRehydrateDeviceProfileStorage } from './utils/rehydrate'

export const useStreamingDeviceProfileStore = create<DeviceProfileStore>()(
	devtools(
		persist(
			(set) => ({
				deviceProfile: getDeviceProfile(StreamingQuality.Original, 'stream'),
				setDeviceProfile: (data: DeviceProfile) => setStreamingDeviceProfile(set, data),
			}),
			{
				name: 'streaming-device-profile-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
				onRehydrateStorage: onRehydrateDeviceProfileStorage,
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
