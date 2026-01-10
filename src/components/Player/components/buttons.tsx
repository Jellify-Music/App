import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { useTogglePlayback } from '../../../hooks/player/callbacks'
import { usePlaybackState } from '../../../hooks/player/queries'
import React from 'react'
import Icon from '../../Global/components/icon'

export default function PlayPauseButton({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const togglePlayback = useTogglePlayback()

	const state = usePlaybackState()

	const handlePlaybackToggle = async () => await togglePlayback(state)

	const largeIcon = isUndefined(size) || size >= 24

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{['stopped'].includes(state ?? 'stopped') ? (
				<Circle size={size} disabled borderWidth={'$1.5'} borderColor={'$primary'}>
					<Spinner margin={10} size='small' color={'$primary'} />
				</Circle>
			) : (
				<IconButton
					circular
					largeIcon={largeIcon}
					size={size}
					name={state === 'playing' ? 'pause' : 'play'}
					testID='play-button-test-id'
					onPress={handlePlaybackToggle}
				/>
			)}
		</View>
	)
}

export function PlayPauseIcon(): React.JSX.Element {
	const togglePlayback = useTogglePlayback()
	const state = usePlaybackState()

	const handlePlaybackToggle = async () => await togglePlayback(state)

	return ['stopped'].includes(state ?? 'stopped') ? (
		<Spinner margin={10} color={'$primary'} />
	) : (
		<Icon
			name={state === 'playing' ? 'pause' : 'play'}
			color='$primary'
			onPress={handlePlaybackToggle}
		/>
	)
}
