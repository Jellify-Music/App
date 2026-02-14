import React, { useRef, useState } from 'react'
import { getTokenValue, Spacer, Text, useTheme, XStack, YStack } from 'tamagui'
import { useSeekTo } from '../../../hooks/player/callbacks'
import {
	calculateRunTimeFromSeconds,
	RunTimeSeconds,
} from '../../../components/Global/helpers/time-codes'
import { useProgress } from '../../../hooks/player'
import QualityBadge from './quality-badge'
import { useDisplayAudioQualityBadge } from '../../../stores/settings/player'
import { useCurrentTrack } from '../../../stores/player/queue'
import {
	useSharedValue,
	useAnimatedReaction,
	withTiming,
	Easing,
	ReduceMotion,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import Slider from '@jellify-music/react-native-reanimated-slider'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'
import getTrackDto, { getTrackMediaSourceInfo } from '../../../utils/mapping/track-extra-payload'

export default function Scrubber(): React.JSX.Element {
	const seekTo = useSeekTo()
	const nowPlaying = useCurrentTrack()

	const { position } = useProgress()
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

	const theme = useTheme()

	const item = getTrackDto(nowPlaying)

	const mediaInfo = getTrackMediaSourceInfo(nowPlaying)

	useAnimatedReaction(
		() => displayPosition.value,
		(cur, prev) => {
			if (cur !== prev) runOnJS(handleDisplayPositionChange)(cur)
		},
	)

	useAnimatedReaction(
		() => position,
		(cur, prev) => {
			if (!isSeeking.current) {
				displayPosition.value = withTiming(position, {
					duration: Math.round(Math.abs(cur - (prev ?? 0))) === 1 ? 1000 : 200,
					easing: Easing.linear,
				})
			}
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

				<YStack alignItems='center' justifyContent='center' flex={2}>
					{nowPlaying && mediaInfo && displayAudioQualityBadge ? (
						<QualityBadge item={item!} mediaSourceInfo={mediaInfo} />
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
