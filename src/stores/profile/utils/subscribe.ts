import { postFullCapabilities } from '../../../api/mutations/capabilities/utils'
import JellifyStore from '../../auth/types'
import { DeviceProfileStore } from '../types'

/**
 * Posts the device profile to the server when a user signs in.
 *
 * Rehydration only reports the profile when the app starts with a signed in user,
 * so a fresh sign in would otherwise go unreported until the next app start.
 */
export const onJellifyStoreChange =
	(getDeviceProfileStore: () => DeviceProfileStore) =>
	(state: JellifyStore, prevState: JellifyStore) => {
		const accessToken = state.user?.accessToken

		if (accessToken && accessToken !== prevState.user?.accessToken)
			postFullCapabilities(getDeviceProfileStore().deviceProfile)
	}
