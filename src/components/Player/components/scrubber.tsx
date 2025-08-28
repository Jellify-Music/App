import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { HorizontalSlider } from '../../../components/Global/helpers/slider'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { trigger } from 'react-native-haptic-feedback'
import { XStack, YStack } from 'tamagui'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useSeekTo } from '../../../providers/Player/hooks/mutations'
import { RunTimeSeconds } from '../../../components/Global/helpers/time-codes'
import { UPDATE_INTERVAL } from '../../../player/config'
import { ProgressMultiplier } from '../component.config'
import { useReducedHapticsContext } from '../../../providers/Settings'
import { useNowPlaying, useProgress } from '../../../providers/Player/hooks/queries'
import QualityBadge from './quality-badge'
import { useDisplayAudioQualityBadge } from '../../../stores/player-settings'

// Create a simple pan gesture
const scrubGesture = Gesture.Pan().runOnJS(true)

export default function Scrubber(): React.JSX.Element {
	const { mutate: seekTo, isPending: seekPending, mutateAsync: seekToAsync } = useSeekTo()
	const { data: nowPlaying } = useNowPlaying()
	const { width } = useSafeAreaFrame()
	const reducedHaptics = useReducedHapticsContext()

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
			!seekPending &&
			Math.abs(calculatedPosition - lastPositionRef.current) > 1 // Only update if position changed significantly
		) {
			setDisplayPosition(calculatedPosition)
			lastPositionRef.current = calculatedPosition
		}
	}, [calculatedPosition, seekPending])

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

			return seekToAsync(seekTime).finally(() => {
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
					<YStack alignItems='flex-start' flexShrink={1}>
						<RunTimeSeconds alignment='left'>{currentSeconds}</RunTimeSeconds>
					</YStack>

					<YStack alignItems='center' flexGrow={1}>
						{nowPlaying?.mediaSourceInfo && displayAudioQualityBadge && (
							<QualityBadge
								item={nowPlaying.item}
								sourceType={nowPlaying.sourceType}
								mediaSourceInfo={nowPlaying.mediaSourceInfo}
							/>
						)}
					</YStack>

					<YStack alignItems='flex-end' flexShrink={1}>
						<RunTimeSeconds alignment='right'>{totalSeconds}</RunTimeSeconds>
					</YStack>
				</XStack>
			</YStack>
		</GestureDetector>
	)
}
