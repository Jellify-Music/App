import React, { useCallback, useMemo } from 'react'
import { XStack, useTheme, YStack, getToken } from 'tamagui'
import { Text } from '../helpers/text'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	interpolate,
} from 'react-native-reanimated'
import Icon from './icon'
import { useAddToQueue } from '../../../providers/Player/hooks/mutations'
import { QueuingType } from '../../../enums/queuing-type'
import { Api } from '@jellyfin/sdk'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'

type SwipeToQueueProps = {
	children: React.ReactNode
	track: BaseItemDto
	api: Api | undefined
	deviceProfile: DeviceProfile | undefined
	networkStatus: networkStatusTypes | null
	disabled?: boolean
}

// A reusable wrapper to provide a swipe-right to "Add to queue" interaction with satisfying animations
export default function SwipeToQueue({
	children,
	track,
	api,
	deviceProfile,
	networkStatus,
	disabled,
}: SwipeToQueueProps): React.JSX.Element {
	const theme = useTheme()
	const { mutate: addToQueue } = useAddToQueue()
	const haptic = useHapticFeedback()

	const MAX_TRANSLATE = 120
	const TRIGGER_THRESHOLD = 80

	const tx = useSharedValue(0)
	const triggered = useSharedValue(false)

	const triggerAdd = useCallback(() => {
		if (disabled) return
		addToQueue({
			api,
			deviceProfile,
			networkStatus,
			tracks: [track],
			queuingType: QueuingType.DirectlyQueued,
		})
	}, [addToQueue, api, deviceProfile, networkStatus, track, disabled])

	const gesture = useMemo(() => {
		return Gesture.Pan()
			.activeOffsetX([10, 9999])
			.failOffsetY([-10, 10])
			.onUpdate((e) => {
				if (disabled) return
				// Only allow swiping to the right
				const next = Math.min(MAX_TRANSLATE, Math.max(0, e.translationX))
				tx.value = next
			})
			.onEnd(() => {
				if (disabled) return
				if (tx.value >= TRIGGER_THRESHOLD && !triggered.value) {
					triggered.value = true
					// Provide immediate light haptic feedback on trigger
					runOnJS(haptic)('impactLight')
					runOnJS(triggerAdd)()
					// Success bounce then close
					tx.value = withSpring(MAX_TRANSLATE, { damping: 15, stiffness: 150 }, () => {
						tx.value = withTiming(0, { duration: 180 }, () => {
							triggered.value = false
						})
					})
				} else {
					// snap back
					tx.value = withTiming(0, { duration: 180 })
				}
			})
	}, [disabled, triggerAdd])

	const progressStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: tx.value }],
		}
	})

	const bgStyle = useAnimatedStyle(() => {
		const opacity = interpolate(tx.value, [0, TRIGGER_THRESHOLD, MAX_TRANSLATE], [0.0, 0.8, 1])
		return {
			opacity,
		}
	})

	const iconStyle = useAnimatedStyle(() => {
		const scale = interpolate(tx.value, [0, TRIGGER_THRESHOLD, MAX_TRANSLATE], [0.8, 1.1, 1])
		return { transform: [{ scale }] }
	})

	const addedOpacity = useAnimatedStyle(() => {
		return { opacity: triggered.value ? 1 : 0 }
	})

	const addOpacity = useAnimatedStyle(() => {
		return { opacity: triggered.value ? 0 : 1 }
	})

	if (disabled) return <>{children}</>

	return (
		<GestureDetector gesture={gesture}>
			<YStack
				position='relative'
				overflow='hidden'
				accessibilityRole='none'
				accessibilityHint='Swipe right to add to queue'
			>
				{/* Underlay background */}
				<XStack
					position='absolute'
					top={0}
					left={0}
					right={0}
					bottom={0}
					backgroundColor={theme.primary.val}
					alignItems='center'
				>
					<Animated.View style={[{ marginLeft: getToken('$3') }, bgStyle, iconStyle]}>
						{/* Default copy */}
						<Animated.View style={addOpacity}>
							<XStack alignItems='center' gap='$2'>
								<Icon name='playlist-plus' color={'$background'} />
								<Text color={'$background'}>Add to queue</Text>
							</XStack>
						</Animated.View>

						{/* Success copy */}
						<Animated.View
							style={[{ position: 'absolute', left: 0, right: 0 }, addedOpacity]}
							// Helps screen readers announce success
							accessibilityLiveRegion='polite'
							accessibilityLabel='Added to queue'
						>
							<XStack alignItems='center' gap='$2'>
								<Icon name='check' color={'$background'} />
								<Text color={'$background'}>Added</Text>
							</XStack>
						</Animated.View>
					</Animated.View>
				</XStack>

				{/* Foreground content */}
				<Animated.View style={progressStyle}>{children}</Animated.View>
			</YStack>
		</GestureDetector>
	)
}
