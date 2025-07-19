import { State } from 'react-native-track-player'
import { Circle, Spinner, View } from 'tamagui'
import { usePlayerContext } from '../../../providers/Player'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'

export default function PlayPauseButton({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const { useTogglePlayback, playbackState } = usePlayerContext()

	let button: React.JSX.Element

	switch (playbackState) {
		case State.Playing: {
			button = (
				<IconButton
					circular
					largeIcon={isUndefined(size) || size >= 20}
					size={size}
					name='pause'
					testID='pause-button-test-id'
					onPress={() => useTogglePlayback.mutate(undefined)}
				/>
			)
			break
		}

		case State.Buffering:
		case State.Loading: {
			button = (
				<Circle size={size} disabled borderWidth={'$1.5'} borderColor={'$primary'}>
					<Spinner margin={10} size='small' color={'$primary'} />
				</Circle>
			)
			break
		}

		default: {
			button = (
				<IconButton
					circular
					largeIcon={isUndefined(size) || size >= 20}
					size={size}
					name='play'
					testID='play-button-test-id'
					onPress={() => useTogglePlayback.mutate(undefined)}
				/>
			)
			break
		}
	}

	return (
		<View justifyContent='center' alignItems='center' flex={flex}>
			{button}
		</View>
	)
}
