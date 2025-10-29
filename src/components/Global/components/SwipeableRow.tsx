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
	const defaultMaxLeft = 120
	const defaultMaxRight = -120
	const threshold = 80
	const [rightActionsWidth, setRightActionsWidth] = useState(0)
	const [leftActionsWidth, setLeftActionsWidth] = useState(0)

	// Compute how far we allow left swipe. If quick actions exist, use their width; else a sane default.
	const maxRight =
		rightActions && rightActions.length > 0 ? -Math.max(0, rightActionsWidth) : defaultMaxRight

	// Compute how far we allow right swipe. If quick actions exist on left side, use their width.
	const maxLeft =
		leftActions && leftActions.length > 0 ? Math.max(0, leftActionsWidth) : defaultMaxLeft

	const close = () => {
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
	}, [disabled, leftAction, leftActions, rightAction, rightActions, maxRight, maxLeft])

	const fgStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }))
	const leftUnderlayStyle = useAnimatedStyle(() => ({
		opacity: interpolate(tx.value, [0, threshold, maxLeft], [0, 0.9, 1]),
	}))
	const rightUnderlayStyle = useAnimatedStyle(() => ({
		opacity: interpolate(tx.value, [0, -threshold, maxRight], [0, 0.9, 1]),
	}))

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
						<XStack flex={1} backgroundColor={leftAction.color} alignItems='center'>
							<XStack marginLeft={getToken('$3')} alignItems='center'>
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
						pointerEvents='auto'
					>
						{/* Underlay background neutral */}
						<XStack
							flex={1}
							backgroundColor={'$backgroundHover'}
							alignItems='center'
							justifyContent='flex-start'
						>
							<XStack
								gap={8}
								paddingLeft={12}
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
						>
							<XStack marginRight={getToken('$3')} alignItems='center'>
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
						pointerEvents='auto'
					>
						{/* Underlay background neutral to let icon squares stand out */}
						<XStack
							flex={1}
							backgroundColor={'$backgroundHover'}
							alignItems='center'
							justifyContent='flex-end'
						>
							<XStack
								gap={8}
								paddingRight={12}
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
					accessibilityHint={leftAction || rightAction ? 'Swipe for actions' : undefined}
				>
					{children}
				</Animated.View>
			</YStack>
		</GestureDetector>
	)
}
