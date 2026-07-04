import React from 'react'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, ZStack, useWindowDimensions, View, ScrollView } from 'tamagui'
import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Footer from './components/footer'
import BlurredBackground, { BlurOverlay } from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import {
	GestureDetector,
	useNativeGesture,
	usePanGesture,
	useSimultaneousGestures,
} from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-worklets'
import { useCurrentTrack } from '../../stores/player/queue'
import { previous, skip } from '../../hooks/player/functions/controls'
import { GestureEvent } from 'react-native-gesture-handler/lib/typescript/v3/types'
import { PanExtendedHandlerData } from 'react-native-gesture-handler/lib/typescript/v3/hooks/gestures/pan/PanTypes'
import { applyHapticFeedback } from '../../utils/haptics'
import Queue from '../Queue'
import { DraxProvider } from 'react-native-drax'
import PagerView from 'react-native-pager-view'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

export default function PlayerScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const { height } = useSafeAreaFrame()

	return (
		<ZStack fullscreen>
			<BlurredBackground />

			<PagerView orientation={'vertical'} scrollEnabled style={styles.pager}>
				<Player />
				<DraxProvider>
					<Queue />
				</DraxProvider>
			</PagerView>
		</ZStack>
	)
}

export function Player(): React.JSX.Element {
	usePerformanceMonitor('PlayerScreen', 5)

	const nowPlaying = useCurrentTrack()

	const { height } = useSafeAreaFrame()

	// Shared animated value controlled by the large swipe area
	const translateX = useSharedValue(0)

	// Let the native sheet gesture handle vertical dismissals; we only own horizontal swipes
	const sheetDismissGesture = useNativeGesture()

	const onSwipeGestureUpdate = (e: GestureEvent<PanExtendedHandlerData>) => {
		if (Math.abs(e.translationY) < 40) {
			translateX.value = Math.max(-160, Math.min(160, e.translationX))
		}
	}

	const onSwipeGestureDeactivate = (e: GestureEvent<PanExtendedHandlerData>) => {
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
				runOnJS(applyHapticFeedback)('info')
				runOnJS(previous)()
			} else {
				// Inverted: swipe left = next
				translateX.value = withSpring(-220)
				runOnJS(applyHapticFeedback)('info')
				runOnJS(skip)(undefined)
			}
			translateX.value = withDelay(160, withSpring(0))
		} else {
			translateX.value = withSpring(0)
		}
	}

	// Gesture logic for central big swipe area
	// Bail on vertical intent so native sheet dismiss keeps working
	const swipeGesture = usePanGesture({
		activeOffsetX: [-12, 12],
		failOffsetY: [-8, 8],
		simultaneousWith: sheetDismissGesture,
		onUpdate: onSwipeGestureUpdate,
		onDeactivate: onSwipeGestureDeactivate,
	})

	const simultaneousGesture = useSimultaneousGestures(sheetDismissGesture, swipeGesture)

	return nowPlaying ? (
		<ZStack fullscreen>
			<BlurOverlay />

			<YStack justifyContent='center' margin={'$3'} flex={1}>
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

const styles = StyleSheet.create({
	pager: {
		flex: 1,
	},
})
