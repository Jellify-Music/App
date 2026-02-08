import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import {
	usePrevious,
	useSkip,
	useToggleRepeatMode,
	useToggleShuffle,
} from '../../../hooks/player/callbacks'
import { useRepeatModeStoreValue, useShuffle } from '../../../stores/player/queue'

export default function Controls(): React.JSX.Element {
	const previous = usePrevious()
	const skip = useSkip()
	const repeatMode = useRepeatModeStoreValue()

	const toggleRepeatMode = useToggleRepeatMode()

	const shuffled = useShuffle()

	const toggleShuffle = useToggleShuffle()

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
				color={repeatMode === 'off' ? '$color' : '$primary'}
				name={repeatMode === 'track' ? 'repeat-once' : 'repeat'}
				onPress={async () => toggleRepeatMode()}
			/>
		</XStack>
	)
}
