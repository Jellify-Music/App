import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { StoreApi } from 'zustand'

export type DeviceProfileStore = {
	deviceProfile: DeviceProfile
	setDeviceProfile: (data: DeviceProfile) => void
}

export type SetDeviceProfileStore = StoreApi<DeviceProfileStore>['setState']
