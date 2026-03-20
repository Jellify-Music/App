import { State } from 'react-native-track-player'
import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { usePlaybackState } from '../../../hooks/player/queries'
import React from 'react'
import Icon from '../../Global/components/icon'
import { togglePlayback } from '../../../hooks/player/functions/playback'

export default function PlayPauseButton({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const state = usePlaybackState()

	const largeIcon = isUndefined(size) || size >= 24

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{[State.Buffering, State.Loading].includes(state ?? State.None) ? (
				<Circle size={size} disabled borderWidth={'$1.5'} borderColor={'$primary'}>
					<Spinner margin={10} size='small' color={'$primary'} />
				</Circle>
			) : (
				<IconButton
					circular
					largeIcon={largeIcon}
					size={size}
					name={state === State.Playing ? 'pause' : 'play'}
					testID='play-button-test-id'
					onPress={togglePlayback}
				/>
			)}
		</View>
	)
}

export function PlayPauseIcon(): React.JSX.Element {
	const state = usePlaybackState()

	return [State.Buffering, State.Loading].includes(state ?? State.None) ? (
		<Spinner margin={10} color={'$primary'} />
	) : (
		<Icon
			name={state === State.Playing ? 'pause' : 'play'}
			color='$primary'
			onPress={togglePlayback}
		/>
	)
}
