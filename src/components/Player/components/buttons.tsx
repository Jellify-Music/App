import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { useTogglePlayback } from '../../../hooks/player/callbacks'
import { usePlaybackState } from '../../../hooks/player'
import React from 'react'
import Icon from '../../Global/components/icon'
import { TrackPlayer, useNowPlaying, useOnPlaybackStateChange } from 'react-native-nitro-player'

export default function PlayPauseButton({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const togglePlayback = useTogglePlayback()
	const { currentState } = useNowPlaying()
	const PlaybackState = useOnPlaybackStateChange()

	const handlePlaybackToggle = async () => await togglePlayback(currentState)

	const largeIcon = isUndefined(size) || size >= 24

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{['stopped'].includes(currentState ?? 'stopped') ? (
				<Circle size={size} disabled borderWidth={'$1.5'} borderColor={'$primary'}>
					<Spinner margin={10} size='small' color={'$primary'} />
				</Circle>
			) : (
				<IconButton
					circular
					largeIcon={largeIcon}
					size={size}
					name={currentState === 'playing' ? 'pause' : 'play'}
					testID='play-button-test-id'
					onPress={handlePlaybackToggle}
				/>
			)}
		</View>
	)
}

export function PlayPauseIcon(): React.JSX.Element {
	const { currentState } = useNowPlaying()
	const togglePlayback = () => {
		if (currentState === 'playing') {
			TrackPlayer.pause()
		} else {
			TrackPlayer.play()
		}
	}

	return ['stopped'].includes(currentState ?? 'stopped') ? (
		<Spinner margin={10} color={'$primary'} />
	) : (
		<Icon
			name={currentState === 'playing' ? 'pause' : 'play'}
			color='$primary'
			onPress={togglePlayback}
		/>
	)
}
