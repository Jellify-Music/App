import React, { useMemo } from 'react'
import { XStack, YStack, getToken } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import Icon from './icon'
import { Text } from '../helpers/text'

export type SwipeAction = {
	label: string
	icon: string
	color: string // Tamagui token e.g. '$success'
	onTrigger: () => void
}

type Props = {
	children: React.ReactNode
	leftAction?: SwipeAction | null
	rightAction?: SwipeAction | null
	disabled?: boolean
}

/**
 * Shared swipeable row using a Pan gesture. One action allowed per side for simplicity,
 * consistent thresholds and snap behavior across the app.
 */
export default function SwipeableRow({ children, leftAction, rightAction, disabled }: Props) {
	const tx = useSharedValue(0)
	const maxLeft = 120
	const maxRight = -120
	const threshold = 80

	const triggerLeft = () => leftAction?.onTrigger?.()
	const triggerRight = () => rightAction?.onTrigger?.()

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
				if (tx.value > threshold && leftAction) {
					runOnJS(triggerLeft)()
					tx.value = withSpring(maxLeft, { damping: 15, stiffness: 150 }, () => {
						tx.value = withTiming(0, { duration: 180 })
					})
					return
				}
				if (tx.value < -threshold && rightAction) {
					runOnJS(triggerRight)()
					tx.value = withSpring(maxRight, { damping: 15, stiffness: 150 }, () => {
						tx.value = withTiming(0, { duration: 180 })
					})
					return
				}
				tx.value = withTiming(0, { duration: 180 })
			})
	}, [disabled, leftAction, rightAction])

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
				{/* Left action underlay */}
				{leftAction && (
					<Animated.View
						style={[
							{
								position: 'absolute',
								left: 0,
								top: 0,
								bottom: 0,
								justifyContent: 'center',
							},
							leftUnderlayStyle,
						]}
						pointerEvents='none'
					>
						<XStack marginLeft={getToken('$3')} alignItems='center' gap='$2'>
							<Icon name={leftAction.icon} color={'$background'} />
							<Text color={'$background'}>{leftAction.label}</Text>
						</XStack>
					</Animated.View>
				)}

				{/* Right action underlay */}
				{rightAction && (
					<Animated.View
						style={[
							{
								position: 'absolute',
								right: 0,
								top: 0,
								bottom: 0,
								justifyContent: 'center',
								alignItems: 'flex-end',
								width: '100%',
							},
							rightUnderlayStyle,
						]}
						pointerEvents='none'
					>
						<XStack marginRight={getToken('$3')} alignItems='center' gap='$2'>
							<Text color={'$background'}>{rightAction.label}</Text>
							<Icon name={rightAction.icon} color={'$background'} />
						</XStack>
					</Animated.View>
				)}

				{/* Foreground content */}
				<Animated.View style={fgStyle}>{children}</Animated.View>
			</YStack>
		</GestureDetector>
	)
}
