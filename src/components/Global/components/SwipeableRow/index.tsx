import React, { useEffect, useRef, useState } from 'react'
import type { EventHandler } from '../../../../types/Events'
import { XStack, YStack, getToken } from 'tamagui'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'
import { runOnUI } from 'react-native-worklets'
import Icon from '../icon'
import { SWIPE_THRESHOLD, useSwipeableRowGesture } from '../../../../hooks/gestures/row'
import {
	notifySwipeableRowClosed,
	notifySwipeableRowOpened,
	registerSwipeableRow,
	unregisterSwipeableRow,
} from './registery'
import { SwipeableRowProvider } from './context'
import { Pressable } from 'react-native'
import { SwipeAction, QuickAction } from './types'

type SwipeableRowProps = {
	children: React.ReactNode
	id?: string
	onPress?: EventHandler
	onLongPress?: EventHandler
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
	id: stableId,
	onPress,
	onLongPress,
	leftAction,
	leftActions,
	rightAction,
	rightActions,
	disabled,
}: SwipeableRowProps) {
	const tx = useSharedValue(0)
	const idRef = useRef<string | undefined>(undefined)
	// React state for menu open (avoids pointerEvents bug from treating SharedValue object as truthy)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	// Shared value mirror for animated children consumers
	const menuOpenSV = useSharedValue(false)
	const defaultMaxLeft = 120
	const defaultMaxRight = -120
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
		idRef.current = stableId ?? `swipeable-row-${Math.random().toString(36).slice(2)}`
	}

	const syncClosedState = () => {
		setIsMenuOpen(false)
		menuOpenSV.value = false
		notifySwipeableRowClosed(idRef.current!)
	}

	const close = () => {
		console.log('[SR] close() tx=', tx.value, 'id=', idRef.current)
		syncClosedState()
		runOnUI(() => {
			'worklet'
			tx.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) })
		})()
	}

	// Always keep a ref to the latest close so the registry never holds a stale closure.
	// The React compiler may memoize close and prevent re-registration even when the
	// captured values (tx, setIsMenuOpen) are from an older render.
	const closeRef = useRef(close)
	closeRef.current = close

	const openMenu = () => {
		console.log('[SR] openMenu() tx=', tx.value, 'id=', idRef.current)
		setIsMenuOpen(true)
		menuOpenSV.value = true
		notifySwipeableRowOpened(idRef.current!)
	}

	useEffect(() => {
		registerSwipeableRow(idRef.current!, () => closeRef.current())
		return () => {
			unregisterSwipeableRow(idRef.current!)
		}
	}, [])

	const { gesture: combinedGesture, fgOpacity } = useSwipeableRowGesture({
		tx,
		maxLeft,
		maxRight,
		hasLeftSide: !!hasLeftSide,
		hasRightSide: !!hasRightSide,
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
	})

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
		const denom = Math.max(1, Math.min(SWIPE_THRESHOLD, leftMax))
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
		const denom = Math.max(1, Math.min(SWIPE_THRESHOLD, absMax))
		const progress = Math.min(1, Math.max(0, -tx.value / denom))
		const opacity = progress < 1 ? progress * 0.9 : 1
		return {
			opacity,
			zIndex: rightActions && rightActions.length > 0 ? 5 : 10,
		}
	})

	if (disabled) return <>{children}</>

	return (
		<GestureDetector gesture={combinedGesture}>
			<YStack position='relative' overflow='hidden' flex={1}>
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
							paddingLeft={getToken('3')}
						>
							<XStack alignItems='center'>
								<Icon name={leftAction.icon} color={'background'} />
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
							backgroundColor='background'
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
										testID={`quick-action-left-${idx}`}
										width={48}
										height={48}
										alignItems='center'
										justifyContent='center'
										backgroundColor={action.color}
										borderRadius={0}
										opacity='1 press:0.8'
										role='button'
										aria-label={`Left quick action ${action.icon}`}
										onPress={() => {
											action.onPress()
											close()
										}}
									>
										<Icon name={action.icon} color={'background'} />
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
							paddingRight={getToken('3')}
						>
							<XStack alignItems='center'>
								<Icon name={rightAction.icon} color={'background'} />
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
							backgroundColor='background'
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
										opacity='1 press:0.8'
										role='button'
										aria-label={`Right quick action ${action.icon}`}
										onPress={() => {
											action.onPress()
											close()
										}}
									>
										<Icon name={action.icon} color={'background'} />
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
