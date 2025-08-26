import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type DeviceProfileStore = {
	deviceProfile: DeviceProfile
	setDeviceProfile: (data: DeviceProfile) => void
}

export const useDeviceProfileStore = create<DeviceProfileStore>()(
	devtools(
		persist(
			(set) => ({
				deviceProfile: {},
				setDeviceProfile: (data: DeviceProfile) => set({ deviceProfile: data }),
			}),
			{
				name: 'device-profile-storage',
			},
		),
	),
)

const useDeviceProfile = () => {
	return useDeviceProfileStore((state) => state.deviceProfile)
}

export default useDeviceProfile
