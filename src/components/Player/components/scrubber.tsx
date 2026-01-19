import React, { useEffect, useRef, useState } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Spacer, Text, useTheme, XStack, YStack, ZStack } from 'tamagui'
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
import { useCurrentTrack } from '../../../stores/player/queue'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	interpolate,
	Extrapolation,
	useAnimatedReaction,
	Easing,
} from 'react-native-reanimated'
import { LayoutChangeEvent, View } from 'react-native'
import { runOnJS } from 'react-native-worklets'
import { trigger } from 'react-native-haptic-feedback'

const hitSlop = {
	top: 20,
	bottom: 20,
	left: 20,
	right: 20,
}

export default function Scrubber(): React.JSX.Element {
	const seekTo = useSeekTo()
	const nowPlaying = useCurrentTrack()
	const { width } = useSafeAreaFrame()

	const { position } = useProgress(UPDATE_INTERVAL)
	const { duration } = nowPlaying!

	const displayPosition = useSharedValue<number>(0)
	const [positionRunTimeText, setPositionRunTimeText] = useState<string>(
		calculateRunTimeFromSeconds(position),
	)
	const [displayAudioQualityBadge] = useDisplayAudioQualityBadge()

	// Reanimated shared values
	const isInteractingRef = useRef(false)
	const sliderWidthRef = useRef<number>(width / 1.1)
	const sliderXOffsetRef = useRef<number>(0)
	const sliderViewRef = useRef<View>(null)
	const sliderThumbWidthRef = useRef<number>(10)

	const maxDuration = Math.round(duration)
	const totalSeconds = Math.round(duration)

	// Update display position when user is not interacting
	useEffect(() => {
		if (!isInteractingRef.current) {
			displayPosition.set(Easing.linear(position))
		}
	}, [position])

	useEffect(() => {
		if (isInteractingRef.current) trigger('clockTick')
	}, [displayPosition.value])

	// Handle track changes
	useEffect(() => {
		displayPosition.set(Easing.ease(0))
		isInteractingRef.current = false
	}, [nowPlaying?.id])

	const handleSeek = async (position: number) => {
		const seekTime = Math.max(0, position)

		try {
			await seekTo(seekTime)
		} catch (error) {
			console.warn('handleSeek callback failed', error)
		} finally {
			setTimeout(() => {
				isInteractingRef.current = false
			}, 100)
		}
	}

	// Pan gesture for scrubbing
	const panGesture = Gesture.Pan()
		.runOnJS(true)
		.hitSlop(hitSlop)
		.onStart((event) => {
			isInteractingRef.current = true

			const relativeX = event.absoluteX - sliderXOffsetRef.current
			const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
			const value = interpolate(
				clampedX,
				[0, sliderWidthRef.current],
				[0, maxDuration],
				Extrapolation.CLAMP,
			)
			displayPosition.set(value)
		})
		.onUpdate((event) => {
			if (isInteractingRef.current) {
				const relativeX = event.absoluteX - sliderXOffsetRef.current
				const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
				const value = interpolate(
					clampedX,
					[0, sliderWidthRef.current],
					[0, maxDuration],
					Extrapolation.CLAMP,
				)
				displayPosition.set(value)
			}
		})
		.onEnd(async (event) => {
			const relativeX = event.absoluteX - sliderXOffsetRef.current
			const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
			const value = interpolate(
				clampedX,
				[0, sliderWidthRef.current],
				[0, maxDuration],
				Extrapolation.CLAMP,
			)

			displayPosition.set(value)

			await handleSeek(value)
		})

	const tapGesture = Gesture.Tap()
		.runOnJS(true)
		.hitSlop(hitSlop)
		.onBegin(async (event) => {
			isInteractingRef.current = true
			const relativeX = event.absoluteX - sliderXOffsetRef.current
			const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
			const value = interpolate(
				clampedX,
				[0, sliderWidthRef.current],
				[0, maxDuration],
				Extrapolation.CLAMP,
			)
			displayPosition.set(value)
		})
		.onFinalize(async (event, success) => {
			if (!success) return

			const relativeX = event.absoluteX - sliderXOffsetRef.current
			const clampedX = Math.max(0, Math.min(relativeX, sliderWidthRef.current))
			const value = interpolate(
				clampedX,
				[0, sliderWidthRef.current],
				[0, maxDuration],
				Extrapolation.CLAMP,
			)
			displayPosition.set(value)

			await handleSeek(value)
		})

	const nativeGesture = Gesture.Native()

	const seekGesture = Gesture.Simultaneous(tapGesture, panGesture)

	const gesture = Gesture.Race(seekGesture, nativeGesture)

	const thumbAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: interpolate(
					displayPosition.value,
					[0, maxDuration],
					[0, sliderWidthRef.current - sliderThumbWidthRef.current],
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

	useAnimatedReaction(
		() => displayPosition.value,
		(prepared) => {
			runOnJS(setPositionRunTimeText)(calculateRunTimeFromSeconds(Math.round(prepared)))
		},
	)

	return (
		<YStack alignItems='center'>
			<GestureDetector gesture={gesture}>
				{/* Scrubber track and thumb */}
				<ZStack
					ref={sliderViewRef}
					width={'100%'}
					maxWidth={width / 1.1}
					onLayout={scrubberLayout}
					height={'$1'}
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
								width: sliderThumbWidthRef.current,
								height: sliderThumbWidthRef.current,
								borderRadius: sliderThumbWidthRef.current / 2,
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
			<XStack alignItems='flex-start'>
				<YStack flex={1}>
					<Text
						fontFamily={'$body'}
						fontWeight={'bold'}
						textAlign={'left'}
						fontVariant={['tabular-nums']}
					>
						{positionRunTimeText}
					</Text>
				</YStack>

				<YStack alignItems='center' justifyContent='center' flex={1}>
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

				<YStack flex={1}>
					<RunTimeSeconds alignment='right'>{totalSeconds}</RunTimeSeconds>
				</YStack>
			</XStack>
		</YStack>
	)
}
