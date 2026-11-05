import { useCallback, useState } from 'react'
import { GestureResponderEvent } from 'react-native'

/**
 * Defers the Tamagui animation driver for a press fade until the element is first touched.
 *
 * Every element with a `transition` allocates animation state when it mounts. In long lists that adds up
 * to a noticeable share of the JS thread, yet only the handful of rows a user actually taps ever fade.
 * Idle elements therefore render plain, and the fade is switched on from `onPressIn`.
 *
 * @param pressOpacity - Tamagui opacity string including the resting value, e.g. `'1 press:0.5'`
 * @param enabled - Whether the element is pressable at all
 * @param onPressIn - Existing press-in handler to call as well
 */
export default function usePressFade(
	pressOpacity: string,
	enabled: boolean = true,
	onPressIn?: (event: GestureResponderEvent) => unknown,
) {
	const [armed, setArmed] = useState(false)

	const handlePressIn = useCallback(
		(event: GestureResponderEvent) => {
			setArmed(true)
			onPressIn?.(event)
		},
		[onPressIn],
	)

	return {
		transition: armed && enabled ? ('quick' as const) : undefined,
		opacity: enabled ? pressOpacity : undefined,
		onPressIn: handlePressIn,
	}
}
