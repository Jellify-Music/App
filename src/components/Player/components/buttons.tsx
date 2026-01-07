import { State } from 'react-native-track-player'
import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { useTogglePlayback } from '../../../providers/Player/hooks/mutations'
import { usePlaybackState } from '../../../providers/Player/hooks/queries'
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

	const largeIcon = isUndefined(size) || size >= 24

	const button = (() => {
		switch (state) {
			case State.Playing: {
				return (
					<IconButton
						circular
						largeIcon={largeIcon}
						size={size}
						name='pause'
						testID='pause-button-test-id'
						onPress={togglePlayback}
					/>
				)
			}

			case State.Buffering:
			case State.Loading: {
				return (
					<Circle size={size} disabled borderWidth={'$1.5'} borderColor={'$primary'}>
						<Spinner margin={10} size='small' color={'$primary'} />
					</Circle>
				)
			}

			default: {
				return (
					<IconButton
						circular
						largeIcon={largeIcon}
						size={size}
						name='play'
						testID='play-button-test-id'
						onPress={togglePlayback}
					/>
				)
			}
		}
	})()

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{button}
		</View>
	)
}

export function PlayPauseIcon(): React.JSX.Element {
	const togglePlayback = useTogglePlayback()
	const state = usePlaybackState()

	const button = (() => {
		switch (state) {
			case State.Playing: {
				return <Icon name='pause' color='$primary' onPress={togglePlayback} />
			}

			case State.Buffering:
			case State.Loading: {
				return <Spinner margin={10} color={'$primary'} />
			}

			default: {
				return <Icon name='play' color='$primary' onPress={togglePlayback} />
			}
		}
	})()

	return button
}
