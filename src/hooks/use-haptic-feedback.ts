import { HapticFeedbackTypes, trigger } from 'react-native-haptic-feedback'
import { useAppSettingsStore } from '../stores/settings/app'

/**
 * Triggers haptic feedback if the user hasn't enabled "Reduce Haptics" setting.
 * Reads directly from Zustand store - no hook needed, stable reference, works anywhere.
 */
export function triggerHaptic(type?: keyof typeof HapticFeedbackTypes | HapticFeedbackTypes): void {
	const reducedHaptics = useAppSettingsStore.getState().reducedHaptics
	if (!reducedHaptics) {
		trigger(type)
	}
}
