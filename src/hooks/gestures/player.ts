import { applyHapticFeedback } from '../../utils/haptics'
import { useCurrentTrackItemDto } from '../../stores/player/queue'
import {
	useExclusiveGestures,
	useNativeGesture,
	usePanGesture,
	useSimultaneousGestures,
	useTapGesture,
} from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { previous, skip } from '../../player/controls'
import { PanExtendedHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/pan/PanTypes'
import { TapHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/tap/TapTypes'
import { GestureEvent } from 'react-native-gesture-handler/lib/typescript/v3/types'
import { usePlayerContext } from '../../providers/Player'
import { togglePlayback } from '../../player/controls/playback'
import { useToggleFavorite } from '../../api/mutations/favorite/toggle'

// Swipe-to-skip tuning. Horizontal movement has to clearly dominate so vertical
// swipes to the queue (vertical pager) or sheet dismissals don't trigger a skip
const SWIPE_ACTIVE_OFFSET_X = 20
const SWIPE_FAIL_OFFSET_Y = 10
const SWIPE_MAX_TRANSLATION_Y = 30
const SWIPE_DOMINANCE_RATIO = 2
const SWIPE_DISTANCE_THRESHOLD = 120
const SWIPE_FLING_MIN_DISTANCE = 40
const SWIPE_FLING_MIN_VELOCITY = 800

const TAP_MAX_DISTANCE = 4
const DOUBLE_TAP_MAX_NUMBER_OF_TAPS = 2

const isHorizontalSwipe = (
	translationX: number,
	translationY: number,
	velocityX: number,
	velocityY: number,
) => {
	'worklet'
	const absX = Math.abs(translationX)
	const absY = Math.abs(translationY)

	if (absY > SWIPE_MAX_TRANSLATION_Y || absX < absY * SWIPE_DOMINANCE_RATIO) return false

	if (absX > SWIPE_DISTANCE_THRESHOLD) return true

	// Flings need some distance and a mostly-horizontal velocity, not just speed
	return (
		absX > SWIPE_FLING_MIN_DISTANCE &&
		Math.abs(velocityX) > SWIPE_FLING_MIN_VELOCITY &&
		Math.abs(velocityX) > Math.abs(velocityY) * SWIPE_DOMINANCE_RATIO
	)
}

export const useAlbumCoverGesture = () => {
	// Shared animated value controlled by the large swipe area
	const translateX = useSharedValue(0)

	// Let the native sheet gesture handle vertical dismissals; we only own horizontal swipes
	const sheetDismissGesture = useNativeGesture()

	const currentTrack = useCurrentTrackItemDto()

	const { toggleFavorite } = useToggleFavorite(currentTrack!)

	const onSwipeGestureUpdate = (e: GestureEvent<PanExtendedHandlerData>) => {
		'worklet'
		if (
			Math.abs(e.translationY) < SWIPE_MAX_TRANSLATION_Y &&
			Math.abs(e.translationX) > Math.abs(e.translationY) * SWIPE_DOMINANCE_RATIO
		) {
			translateX.set(Math.max(-160, Math.min(160, e.translationX)))
		}
	}

	const onSwipeGestureDeactivate = (e: GestureEvent<PanExtendedHandlerData>) => {
		'worklet'
		if (isHorizontalSwipe(e.translationX, e.translationY, e.velocityX, e.velocityY)) {
			if (e.translationX > 0) {
				// Inverted: swipe right = previous
				translateX.set(220)
				runOnJS(applyHapticFeedback)('info')
				runOnJS(previous)()
			} else {
				// Inverted: swipe left = next
				translateX.set(-220)
				runOnJS(applyHapticFeedback)('info')
				runOnJS(skip)(undefined)
			}
			translateX.set(0)
		} else {
			translateX.set(0)
		}
	}

	const onTapGestureFinalize = async (
		e: GestureEvent<TapHandlerData> & { canceled: boolean },
	) => {
		if (!e.canceled) await togglePlayback()
	}

	// Gesture logic for central big swipe area
	// Bail on vertical intent so native sheet dismiss keeps working
	const swipeGesture = usePanGesture({
		activeOffsetX: [-SWIPE_ACTIVE_OFFSET_X, SWIPE_ACTIVE_OFFSET_X],
		failOffsetY: [-SWIPE_FAIL_OFFSET_Y, SWIPE_FAIL_OFFSET_Y],
		simultaneousWith: sheetDismissGesture,
		onUpdate: onSwipeGestureUpdate,
		onDeactivate: onSwipeGestureDeactivate,
	})

	const tapGesture = useTapGesture({
		runOnJS: true,
		maxDistance: TAP_MAX_DISTANCE,
		onFinalize: onTapGestureFinalize,
	})

	const doubleTapGesture = useTapGesture({
		runOnJS: true,
		numberOfTaps: DOUBLE_TAP_MAX_NUMBER_OF_TAPS,
		maxDistance: TAP_MAX_DISTANCE,
		onFinalize: async (e: GestureEvent<TapHandlerData> & { canceled: boolean }) => {
			if (!e.canceled) await toggleFavorite({ item: currentTrack! })
		},
	})

	// The album pan gesture will always lose to the native gesture without this :)
	const panningGestures = useSimultaneousGestures(sheetDismissGesture, swipeGesture)

	return useExclusiveGestures(panningGestures, doubleTapGesture, tapGesture)
}

export const useDismissQueue = () => {
	const { setPage } = usePlayerContext()

	const onFinalize = () => setPage(0)

	return useTapGesture({
		runOnJS: true,
		onFinalize: onFinalize,
	})
}
