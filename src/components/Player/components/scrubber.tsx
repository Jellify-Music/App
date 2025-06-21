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

// Create a simple pan gesture
const scrubGesture = Gesture.Pan().runOnJS(true)

export default function Scrubber(): React.JSX.Element {
	const { useSeekTo, nowPlaying } = usePlayerContext()
	const { useSkip, usePrevious } = useQueueContext()
	const { width } = useSafeAreaFrame()

	// Track if user is currently seeking
	const [seeking, setSeeking] = useState<boolean>(false)

	// Store the active track ID to detect track changes
	const previousTrackIdRef = useRef<string | null>(null)

	// Get progress from the track player with the specified update interval
	const progress = useProgress(UPDATE_INTERVAL, false)

	// Keep track of position in component state for display
	const [position, setPosition] = useState<number>(
		progress && progress.position ? Math.floor(progress.position * ProgressMultiplier) : 0,
	)

	// Track whether we're in the middle of a slide operation to prevent position jumping
	const isSlidingRef = useRef(false)

	// Calculate maximum track duration - ensure it's never below 1 to prevent slider issues
	const maxDuration = useMemo(() => {
		return progress && progress.duration > 0
			? Math.floor(progress.duration * ProgressMultiplier)
			: 1
	}, [progress.duration])

	const safelyUpdatePosition = useCallback((newPos: number) => {
		// Ensure position is never negative
		const safePosition = Math.max(0, newPos)
		setPosition(safePosition)
	}, [])

	// Update position only if not seeking and no pending operations
	useEffect(() => {
		if (
			!isSlidingRef.current &&
			!useSkip.isPending &&
			!usePrevious.isPending &&
			!useSeekTo.isPending &&
			progress.position !== undefined
		) {
			// Ensure position is never negative
			const newPosition = Math.max(0, Math.floor(progress.position * ProgressMultiplier))
			safelyUpdatePosition(newPosition)
		}
	}, [
		progress.position,
		seeking,
		useSkip.isPending,
		usePrevious.isPending,
		useSeekTo.isPending,
		safelyUpdatePosition,
	])

	// Reset position when track changes
	useEffect(() => {
		if (nowPlaying && nowPlaying.id !== previousTrackIdRef.current) {
			// Track has changed, reset position to 0
			safelyUpdatePosition(0)
			previousTrackIdRef.current = nowPlaying.id || null
		}
	}, [nowPlaying, safelyUpdatePosition])

	return (
		<GestureDetector gesture={scrubGesture}>
			<YStack>
				<HorizontalSlider
					value={position}
					max={maxDuration}
					width={getToken('$20') + getToken('$20')}
					props={{
						maxWidth: width / 1.1,
						onSlideStart: (event, value) => {
							setSeeking(true)
							isSlidingRef.current = true
							trigger('impactLight')
							// Immediately update position, ensuring it's not negative
							safelyUpdatePosition(Math.floor(value))
						},
						onSlideMove: (event, value) => {
							// Reduce haptic feedback frequency on slower devices
							if (Platform.OS === 'ios' || Math.random() > 0.8) {
								trigger('clockTick')
							}

							// Ensure position is within valid range (not negative and not beyond duration)
							if (
								Math.floor(value / ProgressMultiplier) >= 0 &&
								Math.floor(value / ProgressMultiplier) < progress.duration
							) {
								safelyUpdatePosition(Math.floor(value))
							}
						},
						onSlideEnd: (event, value) => {
							trigger('notificationSuccess')

							// Ensure position is not negative
							const safeValue = Math.max(0, Math.floor(value))
							safelyUpdatePosition(safeValue)

							// Ensure we don't seek to a negative position
							const seekPosition = Math.max(
								0,
								Math.floor(safeValue / ProgressMultiplier),
							)
							useSeekTo
								.mutateAsync(seekPosition)
								.then(() => {
									isSlidingRef.current = false
								})
								.catch(() => {
									isSlidingRef.current = false
								})
						},
					}}
				/>

				<XStack margin={'$2'} marginTop={'$3'}>
					<YStack alignItems='flex-start' flex={1}>
						<RunTimeSeconds alignment='left'>
							{Math.max(0, Math.floor(position / ProgressMultiplier))}
						</RunTimeSeconds>
					</YStack>

					<YStack alignItems='center' flex={1}>
						{/** Track metadata can go here */}
					</YStack>

					<YStack alignItems='flex-end' flex={1}>
						<RunTimeSeconds alignment='right'>
							{progress && progress.duration ? progress.duration : 0}
						</RunTimeSeconds>
					</YStack>
				</XStack>
			</YStack>
		</GestureDetector>
	)
}
