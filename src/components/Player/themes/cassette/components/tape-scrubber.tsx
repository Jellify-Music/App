import React from 'react'
import { YStack, XStack, SizableText } from 'tamagui'
import { useProgress } from '../../../../../hooks/player/queries'
import { useSeekTo } from '../../../../../hooks/player/callbacks'
import { UPDATE_INTERVAL } from '../../../../../configs/player.config'
import { Slider } from 'tamagui'
import useHapticFeedback from '../../../../../hooks/use-haptic-feedback'

const COUNTER_COLORS = {
	background: '#1A1A1A',
	digit: '#E8B87D',
	border: '#3A3A3A',
}

export default function TapeScrubber(): React.JSX.Element {
	const progress = useProgress(UPDATE_INTERVAL)
	const seekTo = useSeekTo()
	const trigger = useHapticFeedback()

	const position = progress.position || 0
	const duration = progress.duration || 1

	const handleSeek = (value: number) => {
		trigger('impactLight')
		seekTo(value)
	}

	return (
		<YStack gap='$3' paddingHorizontal='$4'>
			{/* Mechanical counter display */}
			<XStack justifyContent='center' gap='$4'>
				<CounterDisplay value={position} label='POSITION' />
				<YStack width={1} backgroundColor='#4A4A4A' marginVertical='$1' />
				<CounterDisplay value={duration} label='DURATION' />
			</XStack>

			{/* Slider styled like a tape deck slider */}
			<YStack
				backgroundColor='#2A2A2A'
				borderRadius={4}
				padding='$1'
				borderWidth={1}
				borderColor={COUNTER_COLORS.border}
			>
				<Slider
					value={[position]}
					min={0}
					max={duration}
					step={1}
					onValueChange={(values) => handleSeek(values[0])}
				>
					<Slider.Track backgroundColor='#1A1A1A' height={8} borderRadius={4}>
						<Slider.TrackActive
							backgroundColor={COUNTER_COLORS.digit}
							borderRadius={4}
						/>
					</Slider.Track>
					<Slider.Thumb
						index={0}
						circular
						size='$1.5'
						backgroundColor='#D4C4B5'
						borderWidth={2}
						borderColor='#8B7355'
						shadowColor='#000'
						shadowOffset={{ width: 0, height: 2 }}
						shadowOpacity={0.3}
						shadowRadius={2}
						elevation={3}
					/>
				</Slider>
			</YStack>
		</YStack>
	)
}

interface CounterDisplayProps {
	value: number
	label: string
}

function CounterDisplay({ value, label }: CounterDisplayProps): React.JSX.Element {
	const minutes = Math.floor(value / 60)
	const seconds = Math.floor(value % 60)

	return (
		<YStack alignItems='center' gap='$1'>
			<SizableText size='$1' color='#8A8A8A' fontWeight='600' letterSpacing={1}>
				{label}
			</SizableText>
			<XStack
				backgroundColor={COUNTER_COLORS.background}
				paddingHorizontal='$2'
				paddingVertical='$1'
				borderRadius={4}
				borderWidth={1}
				borderColor={COUNTER_COLORS.border}
				gap='$0.5'
			>
				<DigitDisplay value={Math.floor(minutes / 10)} />
				<DigitDisplay value={minutes % 10} />
				<SizableText fontSize={20} fontWeight='700' color={COUNTER_COLORS.digit}>
					:
				</SizableText>
				<DigitDisplay value={Math.floor(seconds / 10)} />
				<DigitDisplay value={seconds % 10} />
			</XStack>
		</YStack>
	)
}

interface DigitDisplayProps {
	value: number
}

function DigitDisplay({ value }: DigitDisplayProps): React.JSX.Element {
	return (
		<YStack
			width={18}
			height={28}
			backgroundColor='#0D0D0D'
			borderRadius={2}
			alignItems='center'
			justifyContent='center'
			borderWidth={1}
			borderColor='#2A2A2A'
		>
			<SizableText fontSize={20} fontWeight='700' color={COUNTER_COLORS.digit}>
				{value}
			</SizableText>
		</YStack>
	)
}
