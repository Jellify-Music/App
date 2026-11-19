import { postFullCapabilities } from '../../../api/mutations/capabilities/utils'
import { DeviceProfileStore } from '../types'

/**
 * Posts the rehydrated device profile to the server on app start.
 *
 * Zustand calls `onRehydrateStorage` with the initial state before hydrating,
 * so the persisted profile is only available in the returned callback.
 */
export function onRehydrateDeviceProfileStorage() {
	return (state?: DeviceProfileStore) => {
		if (!state) return

		postFullCapabilities(state.deviceProfile)
	}
}
