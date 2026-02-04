import React, { useEffect, useRef, useState } from 'react'
import { getTokenValue, Spacer, Text, useTheme, XStack, YStack } from 'tamagui'
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
import { useSharedValue, useAnimatedReaction, withTiming } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import Slider from '@jellify-music/react-native-reanimated-slider'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'

export default function Scrubber(): React.JSX.Element {
	const seekTo = useSeekTo()
	const nowPlaying = useCurrentTrack()

	const { position } = useProgress(UPDATE_INTERVAL)
	const { duration } = nowPlaying!

	const isSeeking = useRef<boolean>(false)
	const lastTickSecond = useRef<number | null>(null)

	const displayPosition = useSharedValue<number>(0)
	const [positionRunTimeText, setPositionRunTimeText] = useState<string>(
		calculateRunTimeFromSeconds(position),
	)
	const [displayAudioQualityBadge] = useDisplayAudioQualityBadge()

	const handleDisplayPositionChange = (cur: number) => {
		// Keep the UI text in sync with the animated shared value.
		setPositionRunTimeText(calculateRunTimeFromSeconds(Math.round(cur)))

		// While the user is actively dragging, emit "ticks" as the scrubber crosses whole seconds.
		if (isSeeking.current) {
			const second = Math.max(0, Math.floor(cur))
			if (lastTickSecond.current !== second) {
				lastTickSecond.current = second
				triggerHaptic('clockTick')
			}
		} else {
			// Reset so the next drag starts fresh.
			lastTickSecond.current = null
		}
	}

	// Update display position when user is not interacting
	useEffect(() => {
		if (!isSeeking.current) displayPosition.set(withTiming(position))
	}, [position])

	// Handle track changes
	useEffect(() => {
		displayPosition.set(withTiming(0))
	}, [nowPlaying?.id])

	const theme = useTheme()

	useAnimatedReaction(
		() => displayPosition.value,
		(cur, prev) => {
			if (cur !== prev) runOnJS(handleDisplayPositionChange)(cur)
		},
	)

	return (
		<YStack alignItems='stretch' gap={'$3'}>
			<Slider
				value={displayPosition}
				maxValue={duration}
				backgroundColor={theme.neutral.val}
				color={theme.primary.val}
				onValueChange={seekTo}
				thumbWidth={getTokenValue('$3')}
				trackHeight={getTokenValue('$2')}
				gestureActiveRef={isSeeking}
				thumbShadowColor={getTokenValue('$color.black')}
				hitSlop={getTokenValue('$8')}
			/>

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
					<RunTimeSeconds alignment='right'>{duration}</RunTimeSeconds>
				</YStack>
			</XStack>
		</YStack>
	)
}
