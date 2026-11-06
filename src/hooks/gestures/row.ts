import {
	useCompetingGestures,
	useLongPressGesture,
	usePanGesture,
	useTapGesture,
} from 'react-native-gesture-handler'
import { Easing, SharedValue, useSharedValue, withTiming } from 'react-native-reanimated'
import { runOnUI } from 'react-native-worklets'
import { applyHapticFeedback } from '../../utils/haptics'
import type { EventHandler } from '../../types/Events'
import type { QuickAction, SwipeAction } from './types'

// Distance a row must be swiped before it opens quick actions or triggers its action
export const SWIPE_THRESHOLD = 80

// Fast flicks open quick actions even if the swipe distance is below the threshold
const SWIPE_VELOCITY_TRIGGER = 800

type SwipeableRowGestureOptions = {
	tx: SharedValue<number>
	maxLeft: number
	maxRight: number
	hasLeftSide: boolean
	hasRightSide: boolean
	isMenuOpen: boolean
	disabled?: boolean
	onPress?: EventHandler
	onLongPress?: EventHandler
	leftAction?: SwipeAction | null
	leftActions?: QuickAction[] | null
	rightAction?: SwipeAction | null
	rightActions?: QuickAction[] | null
	openMenu: () => void
	close: () => void
	syncClosedState: () => void
}

/**
 * Pan, long press and tap gestures for the shared {@link SwipeableRow}.
 *
 * Returns the composed gesture along with the foreground opacity shared value
 * driven by press feedback.
 */
export const useSwipeableRowGesture = ({
	tx,
	maxLeft,
	maxRight,
	hasLeftSide,
	hasRightSide,
	isMenuOpen,
	disabled,
	onPress,
	onLongPress,
	leftAction,
	leftActions,
	rightAction,
	rightActions,
	openMenu,
	close,
	syncClosedState,
}: SwipeableRowGestureOptions) => {
	const dragging = useSharedValue(false)
	const fgOpacity = useSharedValue(1.0)

	// Snap open to expose quick actions, do not auto-trigger
	const snapOpen = (to: number) => {
		applyHapticFeedback('info')
		runOnUI(() => {
			'worklet'
			tx.value = withTiming(to, {
				duration: 140,
				easing: Easing.out(Easing.cubic),
			})
		})()
		openMenu()
	}

	const triggerAction = (action: SwipeAction) => {
		applyHapticFeedback('info')
		action.onTrigger()
		close()
	}

	/**
	 * Reserve the right edge for per-row controls (e.g. three dots) by shrinking the tap area there
	 * so those controls can receive presses without being swallowed by the row tap gesture.
	 */
	const tapGesture = useTapGesture({
		runOnJS: true,
		hitSlop: { right: -64 },
		maxDistance: 2,
		onBegin: () => {
			fgOpacity.set(0.5)
		},
		onDeactivate: (e) => {
			// If a quick-action menu is open, row-level tap should NOT trigger onPress.
			if (!isMenuOpen && onPress && !e.canceled) {
				applyHapticFeedback('info')
				onPress()
			}
		},
		onFinalize: () => {
			fgOpacity.set(1.0)
		},
	})

	const longPressGesture = useLongPressGesture({
		runOnJS: true,
		onBegin: () => {
			fgOpacity.set(0.5)
		},
		onActivate: () => {
			if (onLongPress) {
				applyHapticFeedback('info')
				onLongPress()
			}
			fgOpacity.set(1.0)
		},
		onTouchesCancel: () => {
			fgOpacity.set(1.0)
		},
	})

	const panGesture = usePanGesture({
		runOnJS: true,
		hitSlop: {
			/**
			 * Preserve Swipe to go back system gestures
			 *
			 * This was a value I saw ComputerJazz recommend in an issue on
			 * `react-native-draggable-flatlist`, figured it could serve as a good
			 * basis to start from and tune from there ~Vi
			 *
			 * {@link https://github.com/computerjazz}
			 * {@link https://github.com/computerjazz/react-native-draggable-flatlist/issues/336#issuecomment-970573916}
			 */
			left: -50,
		},
		activeOffsetX: [-15, 15],
		failOffsetY: [-8, 8],
		onBegin: () => {
			if (disabled) return
			dragging.set(true)
			fgOpacity.set(1.0)
		},
		onUpdate: (e) => {
			if (disabled) return
			const next = Math.max(Math.min(e.translationX, maxLeft), maxRight)
			tx.value = next
		},
		onDeactivate: (e) => {
			const success = !e.canceled
			console.log(
				'[SR] pan.onDeactivate success=',
				success,
				'tx=',
				tx.value,
				'isMenuOpen=',
				isMenuOpen,
			)
			if (disabled) return
			if (!success) return
			const v = e.velocityX
			if (tx.value > SWIPE_THRESHOLD) {
				// Right swipe: show left quick actions if provided; otherwise trigger leftAction
				if (leftActions && leftActions.length > 0) return snapOpen(maxLeft)
				if (leftAction) return triggerAction(leftAction)
			}
			// Left swipe (quick actions)
			if (tx.value < -Math.min(SWIPE_THRESHOLD, Math.abs(maxRight) / 2)) {
				if (rightActions && rightActions.length > 0) return snapOpen(maxRight)
				if (rightAction) return triggerAction(rightAction)
			}
			// Velocity fallback (open quick actions if fast flick even without full displacement)
			if (v > SWIPE_VELOCITY_TRIGGER && hasLeftSide) {
				if (leftActions && leftActions.length > 0) return snapOpen(maxLeft)
				if (leftAction) return triggerAction(leftAction)
			}
			if (v < -SWIPE_VELOCITY_TRIGGER && hasRightSide) {
				if (rightActions && rightActions.length > 0) return snapOpen(maxRight)
				if (rightAction) return triggerAction(rightAction)
			}
			runOnUI(() => {
				'worklet'
				tx.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) })
			})()
			syncClosedState()
		},
		onFinalize: () => {
			if (disabled) return
			dragging.set(false)
		},
	})

	const gesture = useCompetingGestures(panGesture, longPressGesture, tapGesture)

	return { gesture, fgOpacity }
}
