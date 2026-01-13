import React, { useEffect, useRef } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { getTokenValue, Spacer, Text, useTheme, XStack, YStack, ZStack } from 'tamagui'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useSeekTo } from '../../../hooks/player/callbacks'
import {
	calculateRunTimeFromSeconds,
	RunTimeSeconds,
} from '../../../components/Global/helpers/time-codes'
import { UPDATE_INTERVAL } from '../../../configs/player.config'
import { useProgress } from '../../../hooks/player/queries'
import QualityBadge from './quality-badge'
import { useDisplayAudioQualityBadge } from '../../../stores/settings/player'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { useCurrentTrack } from '../../../stores/player/queue'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	interpolate,
	Extrapolation,
	useDerivedValue,
} from 'react-native-reanimated'
import { LayoutChangeEvent, View } from 'react-native'

export default function Scrubber(): React.JSX.Element {
	const seekTo = useSeekTo()
	const nowPlaying = useCurrentTrack()
	const { width } = useSafeAreaFrame()
	const trigger = useHapticFeedback()

	const { position } = useProgress(UPDATE_INTERVAL)
	const { duration } = nowPlaying!

	const displayPosition = useSharedValue<number>(0)
	const [displayAudioQualityBadge] = useDisplayAudioQualityBadge()

	// Reanimated shared values
	const isInteractingRef = useRef(false)
	const sliderWidthRef = useRef<number>(width / 1.1)
	const sliderXOffsetRef = useRef<number>(0)
	const sliderViewRef = useRef<View>(null)

	const maxDuration = Math.round(duration)
	const totalSeconds = Math.round(duration)

	// Update display position when user is not interacting
	useEffect(() => {
		if (!isInteractingRef.current) {
			displayPosition.value = withSpring(position)
		}
	}, [position])

	// Handle track changes
	useEffect(() => {
		displayPosition.value = withSpring(0)
		isInteractingRef.current = false
	}, [nowPlaying?.id])

	const handleSeek = async (position: number) => {
		const seekTime = Math.max(0, position)
		try {
			await seekTo(seekTime)
		} catch (error) {
			console.warn('handleSeek callback failed', error)
		}
	}

	// Pan gesture for scrubbing
	const panGesture = Gesture.Pan()
		.runOnJS(true)
		.onStart((event) => {
			isInteractingRef.current = true
			trigger('impactLight')

			const relativeX = event.absoluteX - sliderXOffsetRef.current
			const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
			const value = interpolate(
				clampedX,
				[0, sliderWidthRef.current],
				[0, maxDuration],
				Extrapolation.CLAMP,
			)
			displayPosition.value = value
		})
		.onUpdate((event) => {
			trigger('impactLight')
			if (isInteractingRef.current) {
				const relativeX = event.absoluteX - sliderXOffsetRef.current
				const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
				const value = interpolate(
					clampedX,
					[0, sliderWidthRef.current],
					[0, maxDuration],
					Extrapolation.CLAMP,
				)
				displayPosition.value = value
			}
		})
		.onEnd(() => {
			trigger('impactLight')
			isInteractingRef.current = false
			handleSeek(displayPosition.value)
		})

	const tapGesture = Gesture.Tap()
		.runOnJS(true)
		.onBegin((event) => {
			trigger('impactLight')
			isInteractingRef.current = false
			const relativeX = event.absoluteX - sliderXOffsetRef.current
			const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
			const value = interpolate(
				clampedX,
				[0, sliderWidthRef.current],
				[0, maxDuration],
				Extrapolation.CLAMP,
			)
			displayPosition.value = value
			handleSeek(value)
		})

	const swipeDismissGesture = Gesture.Native()

	const combinedGesture = Gesture.Simultaneous(tapGesture, panGesture, swipeDismissGesture)

	const thumbAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: interpolate(
					displayPosition.value,
					[0, maxDuration],
					[0, sliderWidthRef.current],
					Extrapolation.CLAMP,
				),
			},
		],
	}))

	const progressAnimatedStyle = useAnimatedStyle(() => ({
		width: interpolate(
			displayPosition.value,
			[0, maxDuration],
			[0, sliderWidthRef.current],
			Extrapolation.CLAMP,
		),
	}))

	const theme = useTheme()

	const scrubberLayout = (event: LayoutChangeEvent) => {
		sliderWidthRef.current = event.nativeEvent.layout.width

		// Use measureInWindow to get absolute screen position
		if (sliderViewRef.current) {
			sliderViewRef.current.measureInWindow((x, y, width, height) => {
				sliderXOffsetRef.current = x
				console.debug('Scrubber layout:', {
					width: sliderWidthRef.current,
					xOffset: sliderXOffsetRef.current,
				})
			})
		}
	}

	const positionText = useDerivedValue(() => {
		return calculateRunTimeFromSeconds(Math.round(displayPosition.value))
	})

	return (
		<YStack alignItems='center' gap={'$2'}>
			<GestureDetector gesture={combinedGesture}>
				{/* Scrubber track and thumb */}
				<ZStack
					ref={sliderViewRef}
					width={'100%'}
					maxWidth={width / 1.1}
					justifyContent='center'
					onLayout={scrubberLayout}
				>
					{/* Background track */}
					<View
						style={{
							height: 4,
							backgroundColor: theme.borderColor.val,
							borderRadius: 2,
						}}
					/>

					{/* Progress track */}
					<Animated.View
						style={[
							{
								height: 4,
								backgroundColor: theme.primary.val,
								borderRadius: 2,
							},
							progressAnimatedStyle,
						]}
					/>

					{/* Thumb */}
					<Animated.View
						style={[
							{
								position: 'absolute',
								top: -3,
								width: 10,
								height: 10,
								borderRadius: 6,
								backgroundColor: theme.primary.val,
								shadowColor: theme.black75.val,
								shadowOpacity: 0.3,
								shadowRadius: 3,
								elevation: 5,
							},
							thumbAnimatedStyle,
						]}
					/>
				</ZStack>
			</GestureDetector>

			{/* Time display and quality badge */}
			<XStack alignItems='center' paddingTop={'$2'}>
				<YStack alignItems='flex-start' justifyContent='center' flex={1} height={'$2'}>
					<Animated.View
						style={{
							flex: 1,
							height: getTokenValue('$2'),
							justifyContent: 'center',
						}}
					>
						<Text
							fontFamily={'$body'}
							fontWeight={'bold'}
							textAlign={'left'}
							fontVariant={['tabular-nums']}
						>
							{positionText.value}
						</Text>
					</Animated.View>
				</YStack>

				<YStack alignItems='center' justifyContent='center' flex={1} height={'$1.5'}>
					{nowPlaying?.mediaSourceInfo && displayAudioQualityBadge ? (
						<QualityBadge
							item={nowPlaying.item}
							sourceType={nowPlaying.sourceType}
							mediaSourceInfo={nowPlaying.mediaSourceInfo}
						/>
					) : (
						<Spacer />
					)}
				</YStack>

				<YStack alignItems='flex-end' justifyContent='center' flex={1} height={'$2'}>
					<RunTimeSeconds alignment='right'>{totalSeconds}</RunTimeSeconds>
				</YStack>
			</XStack>
		</YStack>
	)
}
