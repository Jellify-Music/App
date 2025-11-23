import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { XStack, YStack, getToken } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	cancelAnimation,
} from 'react-native-reanimated'
import Icon from './icon'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import {
	notifySwipeableRowClosed,
	notifySwipeableRowOpened,
	registerSwipeableRow,
	unregisterSwipeableRow,
} from './swipeable-row-registry'
import { scheduleOnRN } from 'react-native-worklets'
import { SwipeableRowProvider } from './swipeable-row-context'
import { Pressable } from 'react-native'

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
	onPress?: () => Promise<void> | null
	onLongPress?: () => void | null
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
	onPress,
	onLongPress,
	leftAction,
	leftActions,
	rightAction,
	rightActions,
	disabled,
}: Props) {
	const triggerHaptic = useHapticFeedback()
	const tx = useSharedValue(0)
	const dragging = useSharedValue(false)
	const idRef = useRef<string | undefined>(undefined)
	// React state for menu open (avoids pointerEvents bug from treating SharedValue object as truthy)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	// Shared value mirror for animated children consumers
	const menuOpenSV = useSharedValue(false)
	const defaultMaxLeft = 120
	const defaultMaxRight = -120
	const threshold = 80
	const [rightActionsWidth, setRightActionsWidth] = useState(0)
	const [leftActionsWidth, setLeftActionsWidth] = useState(0)
	const ACTION_SIZE = 48

	// Compute how far we allow left swipe. If quick actions exist, use their width; else a sane default.
	const hasRightSide = !!rightAction || (rightActions && rightActions.length > 0)
	const measuredRightWidth =
		rightActions && rightActions.length > 0
			? rightActionsWidth || rightActions.length * ACTION_SIZE
			: 0
	const maxRight = hasRightSide
		? rightActions && rightActions.length > 0
			? -Math.max(0, measuredRightWidth)
			: defaultMaxRight
		: 0

	// Compute how far we allow right swipe. If quick actions exist on left side, use their width.
	const hasLeftSide = !!leftAction || (leftActions && leftActions.length > 0)
	const measuredLeftWidth =
		leftActions && leftActions.length > 0
			? leftActionsWidth || leftActions.length * ACTION_SIZE
			: 0
	const maxLeft = hasLeftSide
		? leftActions && leftActions.length > 0
			? Math.max(0, measuredLeftWidth)
			: defaultMaxLeft
		: 0

	if (!idRef.current) {
		idRef.current = `swipeable-row-${Math.random().toString(36).slice(2)}`
	}

	const syncClosedState = useCallback(() => {
		setIsMenuOpen(false)
		menuOpenSV.value = false
		notifySwipeableRowClosed(idRef.current!)
	}, [menuOpenSV])

	const close = useCallback(() => {
		syncClosedState()
		cancelAnimation(tx)
		tx.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) })
	}, [syncClosedState, tx])

	const openMenu = useCallback(() => {
		setIsMenuOpen(true)
		menuOpenSV.value = true
		notifySwipeableRowOpened(idRef.current!)
	}, [menuOpenSV])

	useEffect(() => {
		registerSwipeableRow(idRef.current!, close)
		return () => {
			unregisterSwipeableRow(idRef.current!)
		}
	}, [close])

	// menu open state now handled in React, no SharedValue mirroring required

	const fgOpacity = useSharedValue(1.0)

	const tapGesture = useMemo(() => {
		// Reserve the right edge for per-row controls (e.g. three dots) by shrinking the tap area there
		// so those controls can receive presses without being swallowed by the row tap gesture.
		return Gesture.Tap()
			.runOnJS(true)
			.hitSlop({ right: -64 })
			.maxDistance(2)
			.onBegin(() => {
				fgOpacity.set(0.5)
			})
			.onEnd((e, success) => {
				// If a quick-action menu is open, row-level tap should NOT trigger onPress.
				if (!isMenuOpen && onPress && success) {
					triggerHaptic('impactLight')
					onPress()
				}
			})
			.onFinalize(() => {
				fgOpacity.set(1.0)
			})
	}, [onPress, isMenuOpen])

	const longPressGesture = useMemo(() => {
		return Gesture.LongPress()
			.runOnJS(true)
			.onBegin(() => {
				fgOpacity.set(0.5)
			})
			.onStart(() => {
				if (onLongPress) {
					triggerHaptic('effectDoubleClick')
					onLongPress()
				}
				fgOpacity.set(1.0)
			})
			.onTouchesCancelled(() => {
				fgOpacity.set(1.0)
			})
	}, [onLongPress])

	const panGesture = useMemo(() => {
		return Gesture.Pan()
			.runOnJS(true)
			.hitSlop({
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
			})
			.activeOffsetX([-15, 15])
			.failOffsetY([-8, 8])
			.onBegin(() => {
				if (disabled) return
				dragging.set(true)
				fgOpacity.set(1.0)
			})
			.onUpdate((e) => {
				if (disabled) return
				const next = Math.max(Math.min(e.translationX, maxLeft), maxRight)
				tx.value = next
			})
			.onEnd((e) => {
				if (disabled) return
				// Velocity-based assistance: fast flicks open even if displacement below threshold
				const v = e.velocityX
				const velocityTrigger = 800
				if (tx.value > threshold) {
					// Right swipe: show left quick actions if provided; otherwise trigger leftAction
					if (leftActions && leftActions.length > 0) {
						triggerHaptic('impactLight')
						// Snap open to expose quick actions, do not auto-trigger
						cancelAnimation(tx)
						tx.value = withTiming(maxLeft, {
							duration: 140,
							easing: Easing.out(Easing.cubic),
						})
						openMenu()
						return
					} else if (leftAction) {
						triggerHaptic('impactLight')
						cancelAnimation(tx)
						tx.value = withTiming(
							maxLeft,
							{ duration: 140, easing: Easing.out(Easing.cubic) },
							() => {
								scheduleOnRN(leftAction.onTrigger)
								cancelAnimation(tx)
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
						triggerHaptic('impactLight')
						// Snap open to expose quick actions, do not auto-trigger
						cancelAnimation(tx)
						tx.value = withTiming(maxRight, {
							duration: 140,
							easing: Easing.out(Easing.cubic),
						})
						openMenu()
						return
					} else if (rightAction) {
						triggerHaptic('impactLight')
						cancelAnimation(tx)
						tx.value = withTiming(
							maxRight,
							{ duration: 140, easing: Easing.out(Easing.cubic) },
							() => {
								scheduleOnRN(rightAction.onTrigger)
								cancelAnimation(tx)
								tx.value = withTiming(0, {
									duration: 160,
									easing: Easing.out(Easing.cubic),
								})
							},
						)
						return
					}
				}
				// Velocity fallback (open quick actions if fast flick even without full displacement)
				if (v > velocityTrigger && hasLeftSide) {
					if (leftActions && leftActions.length > 0) {
						triggerHaptic('impactLight')
						cancelAnimation(tx)
						tx.value = withTiming(maxLeft, {
							duration: 140,
							easing: Easing.out(Easing.cubic),
						})
						openMenu()
						return
					} else if (leftAction) {
						triggerHaptic('impactLight')
						cancelAnimation(tx)
						tx.value = withTiming(
							maxLeft,
							{ duration: 140, easing: Easing.out(Easing.cubic) },
							() => {
								scheduleOnRN(leftAction.onTrigger)
								cancelAnimation(tx)
								tx.value = withTiming(0, {
									duration: 160,
									easing: Easing.out(Easing.cubic),
								})
							},
						)
						return
					}
				}
				if (v < -velocityTrigger && hasRightSide) {
					if (rightActions && rightActions.length > 0) {
						triggerHaptic('impactLight')
						cancelAnimation(tx)
						tx.value = withTiming(maxRight, {
							duration: 140,
							easing: Easing.out(Easing.cubic),
						})
						openMenu()
						return
					} else if (rightAction) {
						triggerHaptic('impactLight')
						cancelAnimation(tx)
						tx.value = withTiming(
							maxRight,
							{ duration: 140, easing: Easing.out(Easing.cubic) },
							() => {
								scheduleOnRN(rightAction.onTrigger)
								cancelAnimation(tx)
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
				syncClosedState()
			})
			.onFinalize(() => {
				if (disabled) return
				dragging.set(false)
			})
	}, [
		disabled,
		leftAction,
		leftActions,
		rightAction,
		rightActions,
		maxRight,
		maxLeft,
		openMenu,
		syncClosedState,
		triggerHaptic,
	])

	const fgStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: tx.value,
			},
		],
		opacity: withTiming(fgOpacity.value, { easing: Easing.bounce }),
		zIndex: 20,
	}))
	// Keep the tap-to-close overlay anchored to the foreground so quick actions stay interactive
	const overlayStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: tx.value,
			},
		],
	}))
	const leftUnderlayStyle = useAnimatedStyle(() => {
		// Normalize progress to [0,1]
		const leftMax = maxLeft === 0 ? 1 : maxLeft
		const denom = Math.max(1, Math.min(threshold, leftMax))
		const progress = Math.min(1, Math.max(0, tx.value / denom))
		const opacity = progress < 1 ? progress * 0.9 : 1
		return {
			opacity,
			// Quick-action buttons should sit visually beneath content
			zIndex: leftActions && leftActions.length > 0 ? 5 : 10,
		}
	})
	const rightUnderlayStyle = useAnimatedStyle(() => {
		const rightMax = maxRight === 0 ? -1 : maxRight
		const absMax = Math.abs(rightMax)
		const denom = Math.max(1, Math.min(threshold, absMax))
		const progress = Math.min(1, Math.max(0, -tx.value / denom))
		const opacity = progress < 1 ? progress * 0.9 : 1
		return {
			opacity,
			zIndex: rightActions && rightActions.length > 0 ? 5 : 10,
		}
	})

	if (disabled) return <>{children}</>

	const combinedGesture = Gesture.Race(panGesture, longPressGesture, tapGesture)

	return (
		<GestureDetector gesture={combinedGesture}>
			<YStack position='relative' overflow='hidden'>
				{/* Left action underlay with colored background (icon-only) */}
				{leftAction && !leftActions && (
					<Animated.View
						style={[
							{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 0,
								bottom: 0,
							},
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
							{
								position: 'absolute',
								left: 0,
								width: measuredLeftWidth,
								top: 0,
								bottom: 0,
							},
							leftUnderlayStyle,
						]}
						pointerEvents={isMenuOpen ? 'auto' : 'none'}
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
										// Maestro test id for left quick action button
										// pattern: quick-action-left-<index>
										testID={`quick-action-left-${idx}`}
										width={48}
										height={48}
										alignItems='center'
										justifyContent='center'
										backgroundColor={action.color}
										borderRadius={0}
										pressStyle={{ opacity: 0.8 }}
										accessibilityRole='button'
										accessibilityLabel={`Left quick action ${action.icon}`}
										onPress={() => {
											action.onPress()
											close()
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
							{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 0,
								bottom: 0,
							},
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
							{
								position: 'absolute',
								right: 0,
								width: Math.abs(measuredRightWidth),
								top: 0,
								bottom: 0,
							},
							rightUnderlayStyle,
						]}
						pointerEvents={isMenuOpen ? 'auto' : 'none'}
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
										testID={`quick-action-right-${idx}`}
										width={48}
										height={48}
										alignItems='center'
										justifyContent='center'
										backgroundColor={action.color}
										borderRadius={0}
										pressStyle={{ opacity: 0.8 }}
										accessibilityRole='button'
										accessibilityLabel={`Right quick action ${action.icon}`}
										onPress={() => {
											action.onPress()
											close()
										}}
									>
										<Icon name={action.icon} color={'$background'} />
									</XStack>
								))}
							</XStack>
						</XStack>
					</Animated.View>
				)}

				{/* Foreground content (provider wraps children to expose tx & menu open shared value) */}
				<SwipeableRowProvider
					value={{
						tx,
						menuOpenSV,
						leftWidth: measuredLeftWidth,
						rightWidth: Math.abs(measuredRightWidth),
					}}
				>
					<Animated.View
						style={fgStyle}
						// Disable touches only while a menu is open; allow presses when closed
						pointerEvents={isMenuOpen ? 'none' : 'auto'}
						accessibilityHint={
							leftAction || rightAction ? 'Swipe for actions' : undefined
						}
					>
						{children}
					</Animated.View>
				</SwipeableRowProvider>

				{/* Tap-capture overlay: sits above foreground, below action buttons */}
				<Animated.View
					style={[
						{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
							zIndex: 30,
						},
						overlayStyle,
					]}
					pointerEvents={isMenuOpen ? 'auto' : 'none'}
				>
					<Pressable
						style={{ flex: 1 }}
						onPress={close}
						pointerEvents={isMenuOpen ? 'auto' : 'none'}
					/>
				</Animated.View>
			</YStack>
		</GestureDetector>
	)
}
