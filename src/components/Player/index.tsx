import React, { useCallback, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, useTheme, ZStack, useWindowDimensions, View, getTokenValue } from 'tamagui'
import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from '../../constants/toast.config'
import { useFocusEffect } from '@react-navigation/native'
import Footer from './components/footer'
import BlurredBackground from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { Platform } from 'react-native'
import { useNowPlaying } from '../../providers/Player/hooks/queries'
import { usePrevious, useSkip } from '../../providers/Player/hooks/mutations'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import Icon from '../Global/components/icon'
import useHapticFeedback from '../../hooks/use-haptic-feedback'

export default function PlayerScreen(): React.JSX.Element {
	usePerformanceMonitor('PlayerScreen', 5)

	const [showToast, setShowToast] = useState(true)

	const { data: nowPlaying } = useNowPlaying()
	const skip = useSkip()
	const previous = usePrevious()

	const trigger = useHapticFeedback()

	const theme = useTheme()

	useFocusEffect(
		useCallback(() => {
			setShowToast(true)
			return () => setShowToast(false)
		}, []),
	)

	const isAndroid = Platform.OS === 'android'

	const { width, height } = useWindowDimensions()

	const { top, bottom } = useSafeAreaInsets()

	// Animated translation for swipe feedback
	const translateX = useSharedValue(0)

	// Provide a nice subtle slide interaction for the whole content
	const contentAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}))

	// Gesture: horizontal pan for skipping tracks
	const swipeGesture = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetX([-12, 12])
				.onUpdate((event) => {
					// Only track mostly horizontal moves
					if (Math.abs(event.translationY) < 40) {
						const next = Math.max(-160, Math.min(160, event.translationX))
						translateX.value = next
					}
				})
				.onEnd((event) => {
					const threshold = 120
					const minVelocity = 600
					const isHorizontal = Math.abs(event.translationY) < 40
					if (
						isHorizontal &&
						(Math.abs(event.translationX) > threshold ||
							Math.abs(event.velocityX) > minVelocity)
					) {
						if (event.translationX > 0) {
							// Swipe right -> skip to next
							translateX.value = withSpring(220)
							runOnJS(trigger)('notificationSuccess')
							runOnJS(skip)(undefined)
						} else {
							// Swipe left -> previous track
							translateX.value = withSpring(-220)
							runOnJS(trigger)('notificationSuccess')
							runOnJS(previous)()
						}
						// Return to resting position after short delay using UI-thread animation
						translateX.value = withDelay(160, withSpring(0))
					} else {
						translateX.value = withSpring(0)
					}
				}),
		[previous, skip, trigger, translateX],
	)

	/**
	 * Styling for the top layer of Player ZStack
	 *
	 * Android Modals extend into the safe area, so we
	 * need to account for that
	 *
	 * Apple devices get a small amount of margin
	 */
	const mainContainerStyle = useMemo(
		() => ({
			marginTop: isAndroid ? top : getTokenValue('$4'),
			marginBottom: bottom * 2,
		}),
		[top, bottom, isAndroid],
	)

	return (
		<View flex={1}>
			{nowPlaying && (
				<ZStack fullscreen>
					<BlurredBackground width={width} height={height} />

					{/* Swipe feedback icons */}
					<Animated.View
						pointerEvents='none'
						style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
					>
						<YStack flex={1} justifyContent='center'>
							<Animated.View
								style={[
									{
										position: 'absolute',
										left: 12,
									},
									useAnimatedStyle(() => ({
										opacity: interpolate(
											Math.max(0, -translateX.value),
											[0, 40, 120],
											[0, 0.25, 1],
										),
									})),
								]}
							>
								<Icon name='skip-previous' color='$primary' large />
							</Animated.View>
							<Animated.View
								style={[
									{
										position: 'absolute',
										right: 12,
									},
									useAnimatedStyle(() => ({
										opacity: interpolate(
											Math.max(0, translateX.value),
											[0, 40, 120],
											[0, 0.25, 1],
										),
									})),
								]}
							>
								<Icon name='skip-next' color='$primary' large />
							</Animated.View>
						</YStack>
					</Animated.View>

					<Animated.View style={contentAnimatedStyle}>
						<YStack
							justifyContent='center'
							flex={1}
							marginHorizontal={'$5'}
							{...mainContainerStyle}
						>
							{/* flexGrow 1 */}
							<GestureDetector gesture={swipeGesture}>
								<YStack>
									<PlayerHeader />
									<SongInfo />
								</YStack>
							</GestureDetector>

							<YStack justifyContent='flex-start' gap={'$5'} flexShrink={1}>
								<Scrubber />

								{/* playback progress goes here */}
								<GestureDetector gesture={swipeGesture}>
									<YStack>
										<Controls />
										<Footer />
									</YStack>
								</GestureDetector>
							</YStack>
						</YStack>
					</Animated.View>
				</ZStack>
			)}
			{showToast && <Toast config={JellifyToastConfig(theme)} />}
		</View>
	)
}
