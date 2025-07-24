import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { usePlayerContext } from '../../../providers/Player'
import { useQueueContext } from '../../../providers/Player/queue'
import { RepeatMode } from 'react-native-track-player'

export default function Controls(): React.JSX.Element {
	const { usePrevious, useSkip } = useQueueContext()
	const { useToggleShuffle, useToggleRepeatMode, repeatMode } = usePlayerContext()

	const { shuffled } = useQueueContext()

	return (
		<XStack
			alignItems='center'
			justifyContent='space-evenly'
			flexShrink={1}
			flexGrow={0.5}
			marginHorizontal={'$2'}
		>
			<Icon
				small
				color={shuffled ? '$primary' : '$color'}
				name='shuffle'
				onPress={useToggleShuffle}
			/>

			<Spacer />

			<Icon
				name='skip-previous'
				color='$primary'
				onPress={() => usePrevious()}
				large
				testID='previous-button-test-id'
			/>

			{/* I really wanted a big clunky play button */}
			<PlayPauseButton size={getToken('$13') - getToken('$9')} />

			<Icon
				name='skip-next'
				color='$primary'
				onPress={() => useSkip()}
				large
				testID='skip-button-test-id'
			/>

			<Spacer />

			<Icon
				small
				color={repeatMode === RepeatMode.Off ? '$color' : '$primary'}
				name={repeatMode === RepeatMode.Track ? 'repeat-once' : 'repeat'}
				onPress={useToggleRepeatMode}
			/>
		</XStack>
	)
}
