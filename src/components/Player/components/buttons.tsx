import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import React from 'react'
import Icon from '../../Global/components/icon'
import { togglePlayback } from '../../../hooks/player/functions/playback'
import { useNowPlaying } from 'react-native-nitro-player'

export default function PlayPauseButton({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const { currentState } = useNowPlaying()

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
					onPress={togglePlayback}
				/>
			)}
		</View>
	)
}

export function PlayPauseIcon(): React.JSX.Element {
	const { currentState } = useNowPlaying()

	const iconName = currentState === 'playing' ? 'pause' : 'play'
	const isTrackStoppedOrBuffering = ['stopped'].includes(currentState ?? 'stopped')

	return isTrackStoppedOrBuffering ? (
		<Spinner margin={10} color={'$primary'} />
	) : (
		<Icon name={iconName} color='$primary' onPress={togglePlayback} />
	)
}
