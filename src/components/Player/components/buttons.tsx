import { State, usePlaybackState } from 'react-native-track-player'
import { Circle, Spinner, View } from 'tamagui'
import IconButton from '../../../components/Global/helpers/icon-button'
import { isUndefined } from 'lodash'
import { useTogglePlayback } from '../../../providers/Player/hooks/mutations'

export default function PlayPauseButton({
	size,
	flex,
}: {
	size?: number | undefined
	flex?: number | undefined
}): React.JSX.Element {
	const { mutate: togglePlayback } = useTogglePlayback()

	const { state } = usePlaybackState()

	let button: React.JSX.Element = <></>

	switch (state) {
		case State.Playing: {
			button = (
				<IconButton
					circular
					largeIcon={isUndefined(size) || size >= 20}
					size={size}
					name='pause'
					testID='pause-button-test-id'
					onPress={togglePlayback}
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
					onPress={togglePlayback}
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
