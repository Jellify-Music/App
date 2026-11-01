import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client'
import { SetDeviceProfileStore } from '../types'
import { postFullCapabilities } from '../../../api/mutations/capabilities/utils'

export const setStreamingDeviceProfile = (set: SetDeviceProfileStore, data: DeviceProfile) => {
	set({ deviceProfile: data })

	postFullCapabilities(data)
}
