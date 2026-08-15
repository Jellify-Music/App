import { Haptics } from '../../configs/haptics.config'
import { useAppSettingsStore } from '../../stores/settings/app'

/**
 * Runs a haptic feedback pattern.
 *
 * @param haptic The {@link Haptics} to use
 * @see {@link useAppSettingsStore}
 */
export const applyHapticFeedback = (haptic: keyof typeof Haptics) => Haptics[haptic]()
