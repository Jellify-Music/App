import { useAppSettingsStore } from '../stores/settings/app'
import { Presets } from 'react-native-pulsar'

/**
 * Triggers haptic feedback if the user hasn't enabled "Reduce Haptics" setting.
 * Reads directly from Zustand store - no hook needed, stable reference, works anywhere.
 */
export function triggerHaptic(type: Exclude<keyof typeof Presets.System, 'Android'>): void {
	const reducedHaptics = useAppSettingsStore.getState().reducedHaptics
	if (!reducedHaptics) {
		Presets.System[type]()
	}
}
