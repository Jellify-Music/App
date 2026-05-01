import { useAppSettingsStore } from '../stores/settings/app'
import { Presets, Settings } from 'react-native-pulsar'

// Disable Pulsar's sound engine so haptic presets only produce vibrations,
// not audible sound that would route through AirPods / speakers.
Settings.enableSound(false)

/**
 * Triggers haptic feedback if the user hasn't enabled "Reduce Haptics" setting.
 * Reads directly from Zustand store - no hook needed, stable reference, works anywhere.
 *
 * @deprecated {@link useAppSettingsStore} will now enable and disable haptics via
 * {@link Settings.enableHaptics} automatically when toggled. You are free to use
 * any of the {@link Presets} provided by `react-native-pulsar`
 */
export function triggerHaptic(type: Exclude<keyof typeof Presets.System, 'Android'>): void {
	const reducedHaptics = useAppSettingsStore.getState().reducedHaptics
	if (!reducedHaptics) {
		Presets.System[type]()
	}
}
