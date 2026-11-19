import { Settings } from 'react-native-pulsar'
import AppSettingsStore, { AppSettingsStoreSet } from '../types'

export const setReducedHaptics =
	(set: AppSettingsStoreSet): AppSettingsStore['setReducedHaptics'] =>
	(reducedHaptics) => {
		Settings.enableHaptics(!reducedHaptics)
		set({ reducedHaptics })
	}
