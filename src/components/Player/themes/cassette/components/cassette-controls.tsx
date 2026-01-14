import React from 'react'
import { YStack, XStack } from 'tamagui'
import { State, RepeatMode } from 'react-native-track-player'
import Icon from '../../../../Global/components/icon'
import {
	useTogglePlayback,
	usePrevious,
	useSkip,
	useToggleShuffle,
	useToggleRepeatMode,
} from '../../../../../hooks/player/callbacks'
import { usePlaybackState } from '../../../../../hooks/player/queries'
import { useShuffle, useRepeatModeStoreValue } from '../../../../../stores/player/queue'

export default function CassetteControls(): React.JSX.Element {
	const playbackState = usePlaybackState()
	const togglePlayback = useTogglePlayback()
	const previous = usePrevious()
	const skip = useSkip()
	const toggleShuffle = useToggleShuffle()
	const toggleRepeatMode = useToggleRepeatMode()

	const shuffled = useShuffle()
	const repeatMode = useRepeatModeStoreValue()

	const isPlaying = playbackState === State.Playing

	return (
		<YStack gap='$3' alignItems='center'>
			{/* Main transport controls */}
			<XStack gap='$3' alignItems='center' justifyContent='center'>
				{/* Rewind/Previous */}
				<TransportButton onPress={previous} size={56}>
					<XStack>
						<Icon name='skip-previous' color='$color' />
					</XStack>
				</TransportButton>

				{/* Play/Pause */}
				<TransportButton onPress={() => togglePlayback(playbackState)} size={72} primary>
					{isPlaying ? (
						<XStack gap='$1'>
							<YStack
								width={8}
								height={24}
								backgroundColor='$color'
								borderRadius={2}
							/>
							<YStack
								width={8}
								height={24}
								backgroundColor='$color'
								borderRadius={2}
							/>
						</XStack>
					) : (
						<YStack
							width={0}
							height={0}
							borderLeftWidth={20}
							borderTopWidth={12}
							borderBottomWidth={12}
							borderLeftColor='$color'
							borderTopColor='transparent'
							borderBottomColor='transparent'
							marginLeft={4}
						/>
					)}
				</TransportButton>

				{/* Fast Forward/Next */}
				<TransportButton onPress={() => skip(undefined)} size={56}>
					<XStack>
						<Icon name='skip-next' color='$color' />
					</XStack>
				</TransportButton>
			</XStack>

			{/* Secondary controls */}
			<XStack gap='$4' alignItems='center' justifyContent='center'>
				{/* Shuffle */}
				<SecondaryButton
					onPress={() => toggleShuffle(shuffled)}
					active={shuffled}
					icon='shuffle'
				/>

				{/* Repeat */}
				<SecondaryButton
					onPress={toggleRepeatMode}
					active={repeatMode !== RepeatMode.Off}
					icon={repeatMode === RepeatMode.Track ? 'repeat-once' : 'repeat'}
				/>
			</XStack>
		</YStack>
	)
}

interface TransportButtonProps {
	onPress: () => void
	size: number
	primary?: boolean
	children: React.ReactNode
}

function TransportButton({
	onPress,
	size,
	primary,
	children,
}: TransportButtonProps): React.JSX.Element {
	return (
		<YStack
			width={size}
			height={size * 0.7}
			backgroundColor='#4A4A4A'
			borderRadius={6}
			alignItems='center'
			justifyContent='center'
			onPress={onPress}
			pressStyle={{
				backgroundColor: '#3A3A3A',
				scale: 0.95,
			}}
			animation='quick'
			shadowColor='#000'
			shadowOffset={{ width: 0, height: 2 }}
			shadowOpacity={0.4}
			shadowRadius={3}
			elevation={4}
			borderWidth={1}
			borderTopColor='#6A6A6A'
			borderLeftColor='#6A6A6A'
			borderRightColor='#2A2A2A'
			borderBottomColor='#2A2A2A'
			{...(primary && {
				backgroundColor: '#5A3A2A',
				borderTopColor: '#7A5A4A',
				borderLeftColor: '#7A5A4A',
				borderRightColor: '#3A2A1A',
				borderBottomColor: '#3A2A1A',
			})}
		>
			{children}
		</YStack>
	)
}

interface SecondaryButtonProps {
	onPress: () => void
	active: boolean
	icon: string
}

function SecondaryButton({ onPress, active, icon }: SecondaryButtonProps): React.JSX.Element {
	return (
		<YStack
			width={44}
			height={44}
			borderRadius={22}
			backgroundColor={active ? '#5A3A2A' : '#3A3A3A'}
			alignItems='center'
			justifyContent='center'
			onPress={onPress}
			pressStyle={{ scale: 0.9 }}
			animation='quick'
			borderWidth={2}
			borderColor={active ? '$warning' : '#4A4A4A'}
		>
			<Icon name={icon} color={active ? '$warning' : '$color'} small />
		</YStack>
	)
}
