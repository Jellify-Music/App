import React, { useEffect, useRef, useState } from 'react'
import { getTokenValue, Paragraph, Spacer, useTheme, XStack, YStack } from 'tamagui'
import { useSeekTo } from '../../../hooks/player/callbacks'
import {
	calculateRunTimeFromSeconds,
	RunTimeSeconds,
} from '../../../components/Global/helpers/time-codes'
import { useProgress } from '../../../hooks/player'
import QualityBadge from './quality-badge'
import { useDisplayAudioQualityBadge } from '../../../stores/settings/player'
import { useCurrentTrack } from '../../../stores/player/queue'
import { useSharedValue, useAnimatedReaction, withTiming, Easing } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'
import Slider from '@jellify-music/react-native-reanimated-slider'
import getTrackDto, { getTrackMediaSourceInfo } from '../../../utils/mapping/track-extra-payload'

interface ScrubberProps {
	onSeekComplete?: (position: number) => void
}

export default function Scrubber({ onSeekComplete }: ScrubberProps = {}): React.JSX.Element {
	const seekTo = useSeekTo()
	const nowPlaying = useCurrentTrack()

	const { position, totalDuration } = useProgress()

	const isSeeking = useRef<boolean>(false)
	const lastDisplaySecond = useRef<number>(Math.round(position))

	const displayPosition = useSharedValue<number>(0)
	const [positionRunTimeText, setPositionRunTimeText] = useState<string>(
		calculateRunTimeFromSeconds(position),
	)
	const [displayAudioQualityBadge] = useDisplayAudioQualityBadge()

	const theme = useTheme()

	const item = getTrackDto(nowPlaying)

	const mediaInfo = getTrackMediaSourceInfo(nowPlaying)

	const handleDisplaySecondChange = (second: number) => {
		if (lastDisplaySecond.current === second) return
		lastDisplaySecond.current = second
		setPositionRunTimeText(calculateRunTimeFromSeconds(second))

		if (isSeeking.current) triggerHaptic('impactSoft')
	}

	useAnimatedReaction(
		() => Math.round(displayPosition.value),
		(cur, prev) => {
			if (cur !== prev) runOnJS(handleDisplaySecondChange)(cur)
		},
	)

	useEffect(() => {
		if (!isSeeking.current) {
			lastDisplaySecond.current = Math.round(position)
			setPositionRunTimeText(calculateRunTimeFromSeconds(position))

			displayPosition.value = withTiming(position, {
				duration: Math.round(Math.abs(displayPosition.value - position)) === 1 ? 1000 : 100,
				easing: Easing.linear,
			})
		}
	}, [position])

	const handleValueChange = async (value: number) => {
		await seekTo(value)
		onSeekComplete?.(value)
	}

	return (
		<YStack alignItems='stretch' gap={'$3'}>
			<Slider
				value={displayPosition}
				maxValue={totalDuration}
				backgroundColor={theme.neutral.val}
				color={theme.primary.val}
				onValueChange={handleValueChange}
				thumbWidth={getTokenValue('$3')}
				trackHeight={getTokenValue('$2')}
				gestureActiveRef={isSeeking}
				thumbShadowColor={getTokenValue('$color.black')}
				hitSlop={getTokenValue('$8')}
			/>

			{/* Time display and quality badge */}
			<XStack alignItems='center' justifyContent='space-between'>
				<YStack flex={1}>
					<Paragraph fontWeight={'$6'} textAlign={'left'} fontVariant={['tabular-nums']}>
						{positionRunTimeText}
					</Paragraph>
				</YStack>

				<YStack alignItems='center' justifyContent='center' flex={2}>
					{nowPlaying && mediaInfo && displayAudioQualityBadge ? (
						<QualityBadge item={item!} mediaSourceInfo={mediaInfo} />
					) : (
						<Spacer />
					)}
				</YStack>

				<YStack flex={1}>
					<RunTimeSeconds alignment='right'>{totalDuration}</RunTimeSeconds>
				</YStack>
			</XStack>
		</YStack>
	)
}
