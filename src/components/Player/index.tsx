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
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-worklets'
import { usePrevious, useSkip } from '../../providers/Player/hooks/mutations'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import Icon from '../Global/components/icon'
import { useCurrentTrack } from '../../stores/player/queue'

export default function PlayerScreen(): React.JSX.Element {
	usePerformanceMonitor('PlayerScreen', 5)

	const [showToast, setShowToast] = useState(true)

	const skip = useSkip()
	const previous = usePrevious()
	const trigger = useHapticFeedback()
	const nowPlaying = useCurrentTrack()

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

	// Shared animated value controlled by the large swipe area
	const translateX = useSharedValue(0)

	// Edge icon opacity styles
	const leftIconStyle = useAnimatedStyle(() => ({
		opacity: interpolate(Math.max(0, -translateX.value), [0, 40, 120], [0, 0.25, 1]),
	}))
	const rightIconStyle = useAnimatedStyle(() => ({
		opacity: interpolate(Math.max(0, translateX.value), [0, 40, 120], [0, 0.25, 1]),
	}))

	// Gesture logic for central big swipe area
	const swipeGesture = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetX([-12, 12])
				.onUpdate((e) => {
					if (Math.abs(e.translationY) < 40) {
						translateX.value = Math.max(-160, Math.min(160, e.translationX))
					}
				})
				.onEnd((e) => {
					const threshold = 120
					const minVelocity = 600
					const isHorizontal = Math.abs(e.translationY) < 40
					if (
						isHorizontal &&
						(Math.abs(e.translationX) > threshold ||
							Math.abs(e.velocityX) > minVelocity)
					) {
						if (e.translationX > 0) {
							// Inverted: swipe right = previous
							translateX.value = withSpring(220)
							runOnJS(trigger)('notificationSuccess')
							runOnJS(previous)()
						} else {
							// Inverted: swipe left = next
							translateX.value = withSpring(-220)
							runOnJS(trigger)('notificationSuccess')
							runOnJS(skip)(undefined)
						}
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

					{/* Swipe feedback icons (topmost overlay) */}
					<Animated.View
						pointerEvents='none'
						style={{
							position: 'absolute',
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
							zIndex: 9999,
						}}
					>
						<YStack flex={1} justifyContent='center'>
							<Animated.View
								style={[{ position: 'absolute', left: 12 }, leftIconStyle]}
							>
								<Icon name='skip-next' color='$primary' large />
							</Animated.View>
							<Animated.View
								style={[{ position: 'absolute', right: 12 }, rightIconStyle]}
							>
								<Icon name='skip-previous' color='$primary' large />
							</Animated.View>
						</YStack>
					</Animated.View>

					{/* Central large swipe area overlay (captures swipe like big album art) */}
					<GestureDetector gesture={swipeGesture}>
						<View
							style={{
								position: 'absolute',
								top: height * 0.18,
								left: width * 0.06,
								right: width * 0.06,
								height: height * 0.36,
								zIndex: 9998,
							}}
						/>
					</GestureDetector>

					<Animated.View style={{ flex: 1 }}>
						<YStack
							justifyContent='center'
							flex={1}
							marginHorizontal={'$5'}
							{...mainContainerStyle}
						>
							{/* flexGrow 1 */}
							<YStack>
								<PlayerHeader />
								<SongInfo />
							</YStack>

							<YStack justifyContent='flex-start' gap={'$5'} flexShrink={1}>
								<Scrubber />

								{/* playback progress goes here */}
								<YStack>
									<Controls />
									<Footer />
								</YStack>
							</YStack>
						</YStack>
					</Animated.View>
				</ZStack>
			)}
			{showToast && <Toast config={JellifyToastConfig(theme)} />}
		</View>
	)
}
