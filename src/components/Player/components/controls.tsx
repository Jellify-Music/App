import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { RepeatMode } from 'react-native-track-player'
import { useRepeatMode } from '../../../providers/Player/hooks/queries'
import {
	usePrevious,
	useSkip,
	useToggleRepeatMode,
	useToggleShuffle,
} from '../../../providers/Player/hooks/mutations'
import { useShuffle } from '../../../stores/player/queue'

export default function Controls(): React.JSX.Element {
	const { mutate: previous } = usePrevious()
	const { mutate: skip } = useSkip()
	const { data: repeatMode } = useRepeatMode()

	const { mutate: toggleRepeatMode } = useToggleRepeatMode()

	const shuffled = useShuffle()

	const { mutate: toggleShuffle } = useToggleShuffle()

	return (
		<XStack alignItems='center' justifyContent='space-between'>
			<Icon
				small
				color={shuffled ? '$primary' : '$color'}
				name='shuffle'
				onPress={() => toggleShuffle(shuffled)}
			/>

			<Spacer />

			<Icon
				name='skip-previous'
				color='$primary'
				onPress={previous}
				large
				testID='previous-button-test-id'
			/>

			{/* I really wanted a big clunky play button */}
			<PlayPauseButton size={getToken('$13') - getToken('$9')} />

			<Icon
				name='skip-next'
				color='$primary'
				onPress={() => skip(undefined)}
				large
				testID='skip-button-test-id'
			/>

			<Spacer />

			<Icon
				small
				color={repeatMode === RepeatMode.Off ? '$color' : '$primary'}
				name={repeatMode === RepeatMode.Track ? 'repeat-once' : 'repeat'}
				onPress={toggleRepeatMode}
			/>
		</XStack>
	)
}
