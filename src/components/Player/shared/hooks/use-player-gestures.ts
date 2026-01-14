import { Gesture, SimultaneousGesture } from 'react-native-gesture-handler'
import { SharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

interface UsePlayerGesturesOptions {
	swipeX: SharedValue<number>
	onSkipNext: () => void
	onSkipPrevious: () => void
	onHapticFeedback: (type: string) => void
	/** Whether to invert swipe direction (default: true for natural feel) */
	invertDirection?: boolean
	/** Swipe threshold in pixels */
	threshold?: number
	/** Minimum velocity to trigger skip */
	minVelocity?: number
}

export function usePlayerGestures({
	swipeX,
	onSkipNext,
	onSkipPrevious,
	onHapticFeedback,
	invertDirection = true,
	threshold = 120,
	minVelocity = 600,
}: UsePlayerGesturesOptions): SimultaneousGesture {
	// Let the native sheet gesture handle vertical dismissals; we only own horizontal swipes
	const sheetDismissGesture = Gesture.Native()

	const swipeGesture = Gesture.Pan()
		.activeOffsetX([-12, 12])
		// Bail on vertical intent so native sheet dismiss keeps working
		.failOffsetY([-8, 8])
		.simultaneousWithExternalGesture(sheetDismissGesture)
		.onUpdate((e) => {
			if (Math.abs(e.translationY) < 40) {
				swipeX.value = Math.max(-160, Math.min(160, e.translationX))
			}
		})
		.onEnd((e) => {
			const isHorizontal = Math.abs(e.translationY) < 40
			if (
				isHorizontal &&
				(Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > minVelocity)
			) {
				const isRightSwipe = e.translationX > 0
				const action = invertDirection
					? isRightSwipe
						? onSkipPrevious
						: onSkipNext
					: isRightSwipe
						? onSkipNext
						: onSkipPrevious

				swipeX.value = withSpring(isRightSwipe ? 220 : -220)
				runOnJS(onHapticFeedback)('notificationSuccess')
				runOnJS(action)()
				swipeX.value = withDelay(160, withSpring(0))
			} else {
				swipeX.value = withSpring(0)
			}
		})

	return Gesture.Simultaneous(sheetDismissGesture, swipeGesture)
}
