import { State } from 'react-native-track-player'
import { Circle, Spinner, View } from 'tamagui'
import { usePlayerContext } from '../../../providers/Player'
import IconButton from '../../../components/Global/helpers/icon-button'

export default function PlayPauseButton({
	size,
}: {
	size?: number | undefined
}): React.JSX.Element {
	const { useTogglePlayback, playbackState } = usePlayerContext()

	let button: React.JSX.Element

	switch (playbackState) {
		case State.Playing: {
			button = (
				<IconButton
					circular
					largeIcon
					size={size}
					name='pause'
					onPress={() => useTogglePlayback.mutate(undefined)}
				/>
			)
			break
		}

		case State.Buffering:
		case State.Loading: {
			button = (
				<Circle size={size} disabled>
					<Spinner marginHorizontal={10} size='small' color={'$borderColor'} />
				</Circle>
			)
			break
		}

		default: {
			button = (
				<IconButton
					circular
					largeIcon
					size={size}
					name='play'
					onPress={() => useTogglePlayback.mutate(undefined)}
				/>
			)
			break
		}
	}

	return (
		<View justifyContent='center' alignItems='center'>
			{button}
		</View>
	)
}
