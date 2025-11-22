import { State } from 'react-native-track-player'
import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { useTogglePlayback } from '../../../providers/Player/hooks/mutations'
import { usePlaybackState } from '../../../providers/Player/hooks/queries'
import React, { useMemo } from 'react'

function PlayPauseButtonComponent({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const togglePlayback = useTogglePlayback()

	const state = usePlaybackState()

	const largeIcon = useMemo(() => isUndefined(size) || size >= 20, [size])

	const button = useMemo(() => {
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
	}, [state, size, largeIcon, togglePlayback])

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{button}
		</View>
	)
}

const PlayPauseButton = React.memo(PlayPauseButtonComponent)

export default PlayPauseButton
