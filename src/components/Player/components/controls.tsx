import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { usePlayerContext } from '../../../providers/Player'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useQueueContext } from '../../../providers/Player/queue'

export default function Controls(): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	const { useSeekBy } = usePlayerContext()

	const { usePrevious, useSkip } = useQueueContext()
	const { nowPlaying, useToggleShuffle } = usePlayerContext()

	const {
		playQueue,
		setPlayQueue,
		currentIndex,
		setCurrentIndex,
		shuffled,
		setShuffled,
		unshuffledQueue,
	} = useQueueContext()

	return (
		<XStack alignItems='center' justifyContent='space-evenly' flexShrink={1} flexGrow={0.5}>
			<Icon
				small
				color={shuffled ? '$primary' : '$color'}
				name='shuffle'
				onPress={() => useToggleShuffle.mutate()}
			/>

			<Spacer />

			<Icon name='skip-previous' onPress={() => usePrevious.mutate()} large />

			{/* I really wanted a big clunky play button */}
			<PlayPauseButton size={getToken('$13') - getToken('$9')} />

			<Icon name='skip-next' onPress={() => useSkip.mutate(undefined)} large />

			<Spacer />

			<Icon small color={'$color'} name='repeat' onPress={() => {}} />
		</XStack>
	)
}
