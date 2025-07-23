import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useProgress } from 'react-native-track-player'
import { HorizontalSlider } from '../../../components/Global/helpers/slider'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { trigger } from 'react-native-haptic-feedback'
import { getToken, XStack, YStack } from 'tamagui'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { usePlayerContext } from '../../../providers/Player'
import { RunTimeSeconds } from '../../../components/Global/helpers/time-codes'
import { UPDATE_INTERVAL } from '../../../player/config'
import { ProgressMultiplier } from '../component.config'
import { useQueueContext } from '../../../providers/Player/queue'
import { Platform } from 'react-native'
import { useSettingsContext } from '../../../providers/Settings'

// Create a simple pan gesture
const scrubGesture = Gesture.Pan().runOnJS(true)

export default function Scrubber(): React.JSX.Element {
	const { useSeekTo, nowPlaying } = usePlayerContext()
	const { useSkip, usePrevious } = useQueueContext()
	const { width } = useSafeAreaFrame()
	const { reducedHaptics } = useSettingsContext()

	// Get progress from the track player with the specified update interval
	const { position, duration } = useProgress(UPDATE_INTERVAL)

	// Single source of truth for the current position
	const [displayPosition, setDisplayPosition] = useState<number>(0)

	// Track user interaction state
	const isUserInteractingRef = useRef(false)
	const lastSeekTimeRef = useRef<number>(0)
	const currentTrackIdRef = useRef<string | null>(null)

	// Calculate maximum track duration in slider units
	const maxDuration = useMemo(() => {
		return Math.round(duration * ProgressMultiplier)
	}, [duration])

	// Calculate current position in slider units
	const calculatedPosition = useMemo(() => {
		return Math.round(position * ProgressMultiplier)
	}, [position])

	// Update display position from playback progress
	useEffect(() => {
		// Only update if user is not interacting and enough time has passed since last seek
		if (
			!isUserInteractingRef.current &&
			Date.now() - lastSeekTimeRef.current > 200 && // 200ms debounce after seeking
			!useSeekTo.isPending &&
			!useSkip.isPending &&
			!usePrevious.isPending
		) {
			setDisplayPosition(calculatedPosition)
		}
	}, [calculatedPosition, useSeekTo.isPending, useSkip.isPending, usePrevious.isPending])

	// Handle track changes
	useEffect(() => {
		const currentTrackId = nowPlaying?.id || null
		if (currentTrackId !== currentTrackIdRef.current) {
			// Track changed - reset position immediately
			setDisplayPosition(0)
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

	// Convert display position to seconds for UI display
	const currentSeconds = useMemo(() => {
		return Math.max(0, Math.round(displayPosition / ProgressMultiplier))
	}, [displayPosition])

	// Get total duration in seconds
	const totalSeconds = useMemo(() => {
		return Math.round(duration)
	}, [duration])

	return (
		<GestureDetector gesture={scrubGesture}>
			<YStack>
				<HorizontalSlider
					value={displayPosition}
					max={maxDuration}
					width={getToken('$20') + getToken('$20')}
					props={{
						maxWidth: width / 1.1,
						onSlideStart: (event, value) => {
							isUserInteractingRef.current = true
							trigger('impactLight')

							// Immediately update position for responsive UI
							const clampedValue = Math.max(0, Math.min(value, maxDuration))
							setDisplayPosition(clampedValue)
						},
						onSlideMove: (event, value) => {
							// Throttled haptic feedback for better performance
							if (!reducedHaptics) {
								trigger('clockTick')
							}

							// Update position with proper clamping
							const clampedValue = Math.max(0, Math.min(value, maxDuration))
							setDisplayPosition(clampedValue)
						},
						onSlideEnd: (event, value) => {
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
					}}
				/>

				<XStack paddingTop={'$2'}>
					<YStack alignItems='flex-start' flex={1}>
						<RunTimeSeconds alignment='left'>{currentSeconds}</RunTimeSeconds>
					</YStack>

					<YStack alignItems='center' flex={1}>
						{/** Track metadata can go here */}
					</YStack>

					<YStack alignItems='flex-end' flex={1}>
						<RunTimeSeconds alignment='right'>{totalSeconds}</RunTimeSeconds>
					</YStack>
				</XStack>
			</YStack>
		</GestureDetector>
	)
}
