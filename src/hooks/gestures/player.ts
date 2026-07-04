import { applyHapticFeedback } from '../../utils/haptics'
import {
	useNativeGesture,
	usePanGesture,
	useSimultaneousGestures,
} from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { previous, skip } from '../player/functions/controls'
import { PanExtendedHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/pan/PanTypes'
import { GestureEvent } from 'react-native-gesture-handler/lib/typescript/v3/types'

export const useAlbumCoverGesture = () => {
	// Shared animated value controlled by the large swipe area
	const translateX = useSharedValue(0)

	// Let the native sheet gesture handle vertical dismissals; we only own horizontal swipes
	const sheetDismissGesture = useNativeGesture()

	const onSwipeGestureUpdate = (e: GestureEvent<PanExtendedHandlerData>) => {
		'worklet'
		if (Math.abs(e.translationY) < 40) {
			translateX.value = Math.max(-160, Math.min(160, e.translationX))
		}
	}

	const onSwipeGestureDeactivate = (e: GestureEvent<PanExtendedHandlerData>) => {
		'worklet'
		const threshold = 120
		const minVelocity = 600
		const isHorizontal = Math.abs(e.translationY) < 40
		if (
			isHorizontal &&
			(Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > minVelocity)
		) {
			if (e.translationX > 0) {
				// Inverted: swipe right = previous
				translateX.value = 220
				runOnJS(applyHapticFeedback)('info')
				runOnJS(previous)()
			} else {
				// Inverted: swipe left = next
				translateX.value = -220
				runOnJS(applyHapticFeedback)('info')
				runOnJS(skip)(undefined)
			}
			translateX.value = 0
		} else {
			translateX.value = 0
		}
	}

	// Gesture logic for central big swipe area
	// Bail on vertical intent so native sheet dismiss keeps working
	const swipeGesture = usePanGesture({
		activeOffsetX: [-12, 12],
		failOffsetY: [-8, 8],
		simultaneousWith: sheetDismissGesture,
		onUpdate: onSwipeGestureUpdate,
		onDeactivate: onSwipeGestureDeactivate,
	})

	return useSimultaneousGestures(sheetDismissGesture, swipeGesture)
}
