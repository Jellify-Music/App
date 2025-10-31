import React, { useMemo, useState } from 'react'
import { XStack, YStack, getToken } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import Icon from './icon'
import { Text } from '../helpers/text'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'

export type SwipeAction = {
	label: string
	icon: string
	color: string // Tamagui token e.g. '$success'
	onTrigger: () => void
}

export type QuickAction = {
	icon: string
	color: string // Tamagui token e.g. '$primary'
	onPress: () => void
}

type Props = {
	children: React.ReactNode
	leftAction?: SwipeAction | null // immediate action on right swipe
	leftActions?: QuickAction[] | null // quick action menu on right swipe
	rightAction?: SwipeAction | null // legacy immediate action on left swipe
	rightActions?: QuickAction[] | null // quick action menu on left swipe
	disabled?: boolean
}

/**
 * Shared swipeable row using a Pan gesture. One action allowed per side for simplicity,
 * consistent thresholds and snap behavior across the app.
 */
export default function SwipeableRow({
	children,
	leftAction,
	leftActions,
	rightAction,
	rightActions,
	disabled,
}: Props) {
	const triggerHaptic = useHapticFeedback()
	const tx = useSharedValue(0)
	const [menuOpen, setMenuOpen] = useState(false)
	const [dragging, setDragging] = useState(false)
	const defaultMaxLeft = 120
	const defaultMaxRight = -120
	const threshold = 80
	const [rightActionsWidth, setRightActionsWidth] = useState(0)
	const [leftActionsWidth, setLeftActionsWidth] = useState(0)

	// Compute how far we allow left swipe. If quick actions exist, use their width; else a sane default.
	const hasRightSide = !!rightAction || (rightActions && rightActions.length > 0)
	const maxRight = hasRightSide
		? rightActions && rightActions.length > 0
			? -Math.max(0, rightActionsWidth)
			: defaultMaxRight
		: 0

	// Compute how far we allow right swipe. If quick actions exist on left side, use their width.
	const hasLeftSide = !!leftAction || (leftActions && leftActions.length > 0)
	const maxLeft = hasLeftSide
		? leftActions && leftActions.length > 0
			? Math.max(0, leftActionsWidth)
			: defaultMaxLeft
		: 0

	const close = () => {
		setMenuOpen(false)
		tx.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) })
	}

	const schedule = (fn?: () => void) => {
		if (!fn) return
		// Defer JS work so the UI bounce plays smoothly
		setTimeout(() => fn(), 0)
	}

	const gesture = useMemo(() => {
		return Gesture.Pan()
			.activeOffsetX([-10, 10])
			.failOffsetY([-10, 10])
			.onBegin(() => {
				if (disabled) return
				runOnJS(setDragging)(true)
			})
			.onUpdate((e) => {
				if (disabled) return
				const next = Math.max(Math.min(e.translationX, maxLeft), maxRight)
				tx.value = next
			})
			.onEnd(() => {
				if (disabled) return
				if (tx.value > threshold) {
					// Right swipe: show left quick actions if provided; otherwise trigger leftAction
					if (leftActions && leftActions.length > 0) {
						runOnJS(triggerHaptic)('impactLight')
						// Snap open to expose quick actions, do not auto-trigger
						tx.value = withTiming(maxLeft, {
							duration: 140,
							easing: Easing.out(Easing.cubic),
						})
						runOnJS(setMenuOpen)(true)
						return
					} else if (leftAction) {
						runOnJS(triggerHaptic)('impactLight')
						tx.value = withTiming(
							maxLeft,
							{ duration: 140, easing: Easing.out(Easing.cubic) },
							() => {
								runOnJS(schedule)(leftAction.onTrigger)
								tx.value = withTiming(0, {
									duration: 160,
									easing: Easing.out(Easing.cubic),
								})
							},
						)
						return
					}
				}
				// Left swipe (quick actions)
				if (tx.value < -Math.min(threshold, Math.abs(maxRight) / 2)) {
					if (rightActions && rightActions.length > 0) {
						runOnJS(triggerHaptic)('impactLight')
						// Snap open to expose quick actions, do not auto-trigger
						tx.value = withTiming(maxRight, {
							duration: 140,
							easing: Easing.out(Easing.cubic),
						})
						runOnJS(setMenuOpen)(true)
						return
					} else if (rightAction) {
						runOnJS(triggerHaptic)('impactLight')
						tx.value = withTiming(
							maxRight,
							{ duration: 140, easing: Easing.out(Easing.cubic) },
							() => {
								runOnJS(schedule)(rightAction.onTrigger)
								tx.value = withTiming(0, {
									duration: 160,
									easing: Easing.out(Easing.cubic),
								})
							},
						)
						return
					}
				}
				tx.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) })
			})
			.onFinalize(() => {
				if (disabled) return
				runOnJS(setDragging)(false)
			})
	}, [disabled, leftAction, leftActions, rightAction, rightActions, maxRight, maxLeft])

	const fgStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }))
	const leftUnderlayStyle = useAnimatedStyle(() => {
		// Normalize progress to [0,1] with a monotonic denominator to avoid non-monotonic ranges
		// when the available swipe distance is smaller than the threshold (e.g., 1 quick action = 48px)
		const leftMax = maxLeft === 0 ? 1 : maxLeft
		const denom = Math.max(1, Math.min(threshold, leftMax))
		const progress = Math.min(1, Math.max(0, tx.value / denom))
		// Slight ease by capping at 0.9 near threshold and 1.0 when fully open
		const opacity = progress < 1 ? progress * 0.9 : 1
		return { opacity }
	})
	const rightUnderlayStyle = useAnimatedStyle(() => {
		const rightMax = maxRight === 0 ? -1 : maxRight // negative value when available
		const absMax = Math.abs(rightMax)
		const denom = Math.max(1, Math.min(threshold, absMax))
		const progress = Math.min(1, Math.max(0, -tx.value / denom))
		const opacity = progress < 1 ? progress * 0.9 : 1
		return { opacity }
	})

	if (disabled) return <>{children}</>

	return (
		<GestureDetector gesture={gesture}>
			<YStack position='relative' overflow='hidden'>
				{/* Left action underlay with colored background (icon-only) */}
				{leftAction && !leftActions && (
					<Animated.View
						style={[
							{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
							leftUnderlayStyle,
						]}
						pointerEvents='none'
					>
						<XStack
							flex={1}
							backgroundColor={leftAction.color}
							alignItems='center'
							paddingLeft={getToken('$3')}
						>
							<XStack alignItems='center'>
								<Icon name={leftAction.icon} color={'$background'} />
							</XStack>
						</XStack>
					</Animated.View>
				)}

				{leftActions && leftActions.length > 0 && (
					<Animated.View
						style={[
							{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
							leftUnderlayStyle,
						]}
						pointerEvents={menuOpen ? 'auto' : 'none'}
					>
						{/* Underlay background matches list background for continuity */}
						<XStack
							flex={1}
							backgroundColor={'$background'}
							alignItems='center'
							justifyContent='flex-start'
						>
							<XStack
								gap={0}
								paddingLeft={0}
								onLayout={(e) => setLeftActionsWidth(e.nativeEvent.layout.width)}
								alignItems='center'
								justifyContent='flex-start'
							>
								{leftActions.map((action, idx) => (
									<XStack
										key={`left-quick-action-${idx}`}
										width={48}
										height={48}
										alignItems='center'
										justifyContent='center'
										backgroundColor={action.color}
										borderRadius={0}
										pressStyle={{ opacity: 0.8 }}
										onPress={() => {
											action.onPress()
											runOnJS(close)()
										}}
									>
										<Icon name={action.icon} color={'$background'} />
									</XStack>
								))}
							</XStack>
						</XStack>
					</Animated.View>
				)}

				{/* Right action underlay or quick actions (left swipe) */}
				{rightAction && !rightActions && (
					<Animated.View
						style={[
							{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
							rightUnderlayStyle,
						]}
						pointerEvents='none'
					>
						<XStack
							flex={1}
							backgroundColor={rightAction.color}
							alignItems='center'
							justifyContent='flex-end'
							paddingRight={getToken('$3')}
						>
							<XStack alignItems='center'>
								<Icon name={rightAction.icon} color={'$background'} />
							</XStack>
						</XStack>
					</Animated.View>
				)}

				{rightActions && rightActions.length > 0 && (
					<Animated.View
						style={[
							{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
							rightUnderlayStyle,
						]}
						pointerEvents={menuOpen ? 'auto' : 'none'}
					>
						{/* Underlay background matches list background to keep continuity */}
						<XStack
							flex={1}
							backgroundColor={'$background'}
							alignItems='center'
							justifyContent='flex-end'
						>
							<XStack
								gap={0}
								paddingRight={0}
								onLayout={(e) => setRightActionsWidth(e.nativeEvent.layout.width)}
								alignItems='center'
								justifyContent='flex-end'
							>
								{rightActions.map((action, idx) => (
									<XStack
										key={`quick-action-${idx}`}
										width={48}
										height={48}
										alignItems='center'
										justifyContent='center'
										backgroundColor={action.color}
										borderRadius={0}
										pressStyle={{ opacity: 0.8 }}
										onPress={() => {
											action.onPress()
											runOnJS(close)()
										}}
									>
										<Icon name={action.icon} color={'$background'} />
									</XStack>
								))}
							</XStack>
						</XStack>
					</Animated.View>
				)}

				{/* Foreground content */}
				<Animated.View
					style={fgStyle}
					pointerEvents={dragging ? 'none' : 'auto'}
					accessibilityHint={leftAction || rightAction ? 'Swipe for actions' : undefined}
				>
					{children}
				</Animated.View>

				{/* Tap-capture overlay: when a quick-action menu is open, tapping the row closes it without triggering child onPress */}
				<XStack
					position='absolute'
					left={0}
					right={0}
					top={0}
					bottom={0}
					pointerEvents={menuOpen ? 'auto' : 'none'}
					onPress={close}
				/>
			</YStack>
		</GestureDetector>
	)
}
