import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { HorizontalSlider } from '../../../components/Global/helpers/slider'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Spacer, XStack, YStack } from 'tamagui'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useSeekTo } from '../../../providers/Player/hooks/mutations'
import { RunTimeSeconds } from '../../../components/Global/helpers/time-codes'
import { UPDATE_INTERVAL } from '../../../player/config'
import { ProgressMultiplier } from '../component.config'
import { useProgress } from '../../../providers/Player/hooks/queries'
import QualityBadge from './quality-badge'
import { useDisplayAudioQualityBadge } from '../../../stores/settings/player'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { useCurrentTrack } from '../../../stores/player/queue'

// Create a simple pan gesture
const scrubGesture = Gesture.Pan()

export default function Scrubber(): React.JSX.Element {
	const seekTo = useSeekTo()
	const nowPlaying = useCurrentTrack()
	const { width } = useSafeAreaFrame()

	const trigger = useHapticFeedback()

	// Get progress from the track player with the specified update interval
	// We *don't* use the duration from this hook because it will have a value of "0"
	// in the event we are transcoding a track...
	const { position } = useProgress(UPDATE_INTERVAL)

	// ...instead we use the duration on the track object
	const { duration } = nowPlaying!

	// Single source of truth for the current position
	const [displayPosition, setDisplayPosition] = useState<number>(0)

	// Track user interaction state
	const isUserInteractingRef = useRef(false)
	const lastSeekTimeRef = useRef<number>(0)
	const currentTrackIdRef = useRef<string | null>(null)
	const lastPositionRef = useRef<number>(0)

	const [displayAudioQualityBadge] = useDisplayAudioQualityBadge()

	// Memoize expensive calculations
	const maxDuration = useMemo(() => {
		return Math.round(duration * ProgressMultiplier)
	}, [duration])

	const calculatedPosition = useMemo(() => {
		return Math.round(position! * ProgressMultiplier)
	}, [position])

	// Optimized position update logic with throttling
	useEffect(() => {
		// Only update if user is not interacting and enough time has passed since last seek
		if (
			!isUserInteractingRef.current &&
			Date.now() - lastSeekTimeRef.current > 200 && // 200ms debounce after seeking
			Math.abs(calculatedPosition - lastPositionRef.current) > 1 // Only update if position changed significantly
		) {
			setDisplayPosition(calculatedPosition)
			lastPositionRef.current = calculatedPosition
		}
	}, [calculatedPosition])

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
		async (position: number) => {
			const seekTime = Math.max(0, position / ProgressMultiplier)
			lastSeekTimeRef.current = Date.now()

			try {
				await seekTo(seekTime)
			} catch (error) {
				console.warn('handleSeek callback failed', error)
				isUserInteractingRef.current = false
				setDisplayPosition(calculatedPosition)
			} finally {
				// Small delay to let the seek settle before allowing updates
				setTimeout(() => {
					isUserInteractingRef.current = false
				}, 100)
			}
		},
		[seekTo, setDisplayPosition],
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
				trigger('clockTick')

				// Update position with proper clamping
				const clampedValue = Math.max(0, Math.min(value, maxDuration))
				setDisplayPosition(clampedValue)
			},
			onSlideEnd: async (event: unknown, value: number) => {
				trigger('notificationSuccess')

				// Clamp final value and update display
				const clampedValue = Math.max(0, Math.min(value, maxDuration))
				setDisplayPosition(clampedValue)

				// Perform the seek operation
				await handleSeek(clampedValue)
			},
		}),
		[maxDuration, handleSeek, calculatedPosition, width],
	)

	return (
		<GestureDetector gesture={scrubGesture}>
			<YStack alignItems='center'>
				<HorizontalSlider
					value={displayPosition}
					max={maxDuration ? maxDuration : 1 * ProgressMultiplier}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					// I'm sorry for this, pikachu. this was the only way I could make the scrubber
					// the correct width
					width={'100%'}
					props={sliderProps}
				/>

				<XStack alignItems='center' paddingTop={'$2'}>
					<YStack alignItems='flex-start' justifyContent='center' flex={1} height={'$2'}>
						<RunTimeSeconds alignment='left'>{currentSeconds}</RunTimeSeconds>
					</YStack>

					<YStack alignItems='center' justifyContent='center' flex={1} height={'$2'}>
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
		</GestureDetector>
	)
}
