import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useProgress } from 'react-native-track-player'
import { HorizontalSlider } from '../../../components/Global/helpers/slider'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { trigger } from 'react-native-haptic-feedback'
import { getToken, XStack, YStack } from 'tamagui'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useNowPlayingContext, useSeekToContext } from '../../../providers/Player'
import { RunTimeSeconds } from '../../../components/Global/helpers/time-codes'
import { UPDATE_INTERVAL } from '../../../player/config'
import { ProgressMultiplier } from '../component.config'
import { useReducedHapticsContext } from '../../../providers/Settings'

// Create a simple pan gesture
const scrubGesture = Gesture.Pan().runOnJS(true)

export default function Scrubber(): React.JSX.Element {
	const useSeekTo = useSeekToContext()
	const nowPlaying = useNowPlayingContext()
	const { width } = useSafeAreaFrame()
	const reducedHaptics = useReducedHapticsContext()

	// Get progress from the track player with the specified update interval
	const { position, duration } = useProgress(UPDATE_INTERVAL)

	// Single source of truth for the current position
	const [displayPosition, setDisplayPosition] = useState<number>(0)

	// Track user interaction state
	const isUserInteractingRef = useRef(false)
	const lastSeekTimeRef = useRef<number>(0)
	const currentTrackIdRef = useRef<string | null>(null)
	const lastPositionRef = useRef<number>(0)

	// Memoize expensive calculations
	const maxDuration = useMemo(() => {
		return Math.round(duration * ProgressMultiplier)
	}, [duration])

	const calculatedPosition = useMemo(() => {
		return Math.round(position * ProgressMultiplier)
	}, [position])

	// Optimized position update logic with throttling
	useEffect(() => {
		// Only update if user is not interacting and enough time has passed since last seek
		if (
			!isUserInteractingRef.current &&
			Date.now() - lastSeekTimeRef.current > 200 && // 200ms debounce after seeking
			!useSeekTo.isPending &&
			Math.abs(calculatedPosition - lastPositionRef.current) > 1 // Only update if position changed significantly
		) {
			setDisplayPosition(calculatedPosition)
			lastPositionRef.current = calculatedPosition
		}
	}, [calculatedPosition, useSeekTo.isPending])

	// Handle track changes
	useEffect(() => {
		const currentTrackId = nowPlaying?.id || null
		if (currentTrackId !== currentTrackIdRef.current) {
			// Track changed - reset position immediately
			setDisplayPosition(0)
			lastPositionRef.current = 0
			isUserInteractingRef.current = false
			lastSeekTimeRef.current = 0
			currentTrackIdRef.current = currentTrackId
		}
	}, [nowPlaying?.id])

	// Optimized seek handler with debouncing
	const handleSeek = useCallback(
		(position: number) => {
			const seekTime = Math.max(0, position / ProgressMultiplier)
			lastSeekTimeRef.current = Date.now()

			return useSeekTo.mutateAsync(seekTime).finally(() => {
				// Small delay to let the seek settle before allowing updates
				setTimeout(() => {
					isUserInteractingRef.current = false
				}, 100)
			})
		},
		[useSeekTo],
	)

	// Memoize time calculations to prevent unnecessary re-renders
	const currentSeconds = useMemo(() => {
		return Math.max(0, Math.round(displayPosition / ProgressMultiplier))
	}, [displayPosition])

	const totalSeconds = useMemo(() => {
		return Math.round(duration)
	}, [duration])

	// Memoize slider props to prevent recreation
	const sliderProps = useMemo(
		() => ({
			maxWidth: width / 1.1,
			onSlideStart: (event: unknown, value: number) => {
				isUserInteractingRef.current = true
				trigger('impactLight')

				// Immediately update position for responsive UI
				const clampedValue = Math.max(0, Math.min(value, maxDuration))
				setDisplayPosition(clampedValue)
			},
			onSlideMove: (event: unknown, value: number) => {
				// Throttled haptic feedback for better performance
				if (!reducedHaptics) {
					trigger('clockTick')
				}

				// Update position with proper clamping
				const clampedValue = Math.max(0, Math.min(value, maxDuration))
				setDisplayPosition(clampedValue)
			},
			onSlideEnd: (event: unknown, value: number) => {
				trigger('notificationSuccess')

				// Clamp final value and update display
				const clampedValue = Math.max(0, Math.min(value, maxDuration))
				setDisplayPosition(clampedValue)

				// Perform the seek operation
				handleSeek(clampedValue).catch(() => {
					// On error, revert to calculated position
					isUserInteractingRef.current = false
					setDisplayPosition(calculatedPosition)
				})
			},
		}),
		[maxDuration, reducedHaptics, handleSeek, calculatedPosition, width],
	)

	return (
		<GestureDetector gesture={scrubGesture}>
			<YStack>
				<HorizontalSlider
					value={displayPosition}
					max={maxDuration ? maxDuration : 1 * ProgressMultiplier}
					width={getToken('$20') + getToken('$20')}
					props={sliderProps}
				/>

				<XStack paddingTop={'$2'}>
					<YStack alignItems='flex-start' flex={2}>
						<RunTimeSeconds alignment='left'>{currentSeconds}</RunTimeSeconds>
					</YStack>

					<YStack alignItems='center' flex={1}>
						{/** Track metadata can go here */}
					</YStack>

					<YStack alignItems='flex-end' flex={2}>
						<RunTimeSeconds alignment='right'>{totalSeconds}</RunTimeSeconds>
					</YStack>
				</XStack>
			</YStack>
		</GestureDetector>
	)
}
