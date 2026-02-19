import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { useTogglePlayback } from '../../../hooks/player/callbacks'
import React from 'react'
import Icon from '../../Global/components/icon'
import { useNowPlaying } from 'react-native-nitro-player'

export default function PlayPauseButton({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const togglePlayback = useTogglePlayback()
	const { currentState } = useNowPlaying()

	const handlePlaybackToggle = async () => await togglePlayback(currentState)

	const largeIcon = isUndefined(size) || size >= 24

	const isTrackStoppedOrBuffering = ['stopped'].includes(currentState ?? 'stopped')

	const iconName = currentState === 'playing' ? 'pause' : 'play'

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{isTrackStoppedOrBuffering ? (
				<Circle size={size} disabled borderWidth={'$1.5'} borderColor={'$primary'}>
					<Spinner margin={10} size='small' color={'$primary'} />
				</Circle>
			) : (
				<IconButton
					circular
					largeIcon={largeIcon}
					size={size}
					name={iconName}
					testID='play-button-test-id'
					onPress={handlePlaybackToggle}
				/>
			)}
		</View>
	)
}

export function PlayPauseIcon(): React.JSX.Element {
	const { currentState } = useNowPlaying()

	const togglePlayback = useTogglePlayback()

	const iconName = currentState === 'playing' ? 'pause' : 'play'
	const isTrackStoppedOrBuffering = ['stopped'].includes(currentState ?? 'stopped')

	return isTrackStoppedOrBuffering ? (
		<Spinner margin={10} color={'$primary'} />
	) : (
		<Icon
			name={iconName}
			color='$primary'
			onPress={async () => await togglePlayback(currentState)}
		/>
	)
}
