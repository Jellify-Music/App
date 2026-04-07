import React from 'react'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, ZStack, useWindowDimensions, View } from 'tamagui'
import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Footer from './components/footer'
import BlurredBackground from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-worklets'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { useCurrentTrack } from '../../stores/player/queue'
import { previous, skip } from '../../hooks/player/functions/controls'

export default function PlayerScreen(): React.JSX.Element {
	usePerformanceMonitor('PlayerScreen', 5)

	const nowPlaying = useCurrentTrack()

	const { width, height } = useWindowDimensions()

	const { height: safeAreaHeight, width: safeAreaWidth } = useSafeAreaFrame()

	const { bottom } = useSafeAreaInsets()

	// Shared animated value controlled by the large swipe area
	const translateX = useSharedValue(0)

	// Let the native sheet gesture handle vertical dismissals; we only own horizontal swipes
	const sheetDismissGesture = Gesture.Native()

	// Gesture logic for central big swipe area
	const swipeGesture = Gesture.Pan()
		.activeOffsetX([-12, 12])
		// Bail on vertical intent so native sheet dismiss keeps working
		.failOffsetY([-8, 8])
		.simultaneousWithExternalGesture(sheetDismissGesture)
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
				(Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > minVelocity)
			) {
				if (e.translationX > 0) {
					// Inverted: swipe right = previous
					translateX.value = withSpring(220)
					runOnJS(triggerHaptic)('notificationSuccess')
					runOnJS(previous)()
				} else {
					// Inverted: swipe left = next
					translateX.value = withSpring(-220)
					runOnJS(triggerHaptic)('notificationSuccess')
					runOnJS(skip)(undefined)
				}
				translateX.value = withDelay(160, withSpring(0))
			} else {
				translateX.value = withSpring(0)
			}
		})

	return nowPlaying ? (
		<ZStack inset={0} position='absolute'>
			<BlurredBackground />

			{/* Central large swipe area overlay (captures swipe like big album art) */}
			<GestureDetector gesture={Gesture.Simultaneous(sheetDismissGesture, swipeGesture)}>
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

			<YStack inset={'$4'} position='absolute' marginBottom={bottom} justifyContent='center'>
				{/* flexGrow 1 */}
				<PlayerHeader />

				<YStack justifyContent='flex-start' gap={'$4'} flexShrink={1}>
					<SongInfo />
					<Scrubber />
					<Controls />
					<Footer />
				</YStack>
			</YStack>
		</ZStack>
	) : (
		<></>
	)
}
