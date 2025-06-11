import React from 'react'
import { XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { usePlayerContext } from '../../../providers/Player'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useQueueContext } from '../../../providers/Player/queue'

export default function Controls(): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	const { useSeekBy } = usePlayerContext()

	const { usePrevious, useSkip } = useQueueContext()

	return (
		<XStack alignItems='center' justifyContent='space-evenly' marginVertical={'$4'}>
			<Icon color={'$borderColor'} name='rewind-15' onPress={() => useSeekBy.mutate(-15)} />

			<Icon
				color={'$borderColor'}
				name='skip-previous'
				onPress={() => usePrevious.mutate()}
				large
			/>

			{/* I really wanted a big clunky play button */}
			<PlayPauseButton size={getToken('$13') - getToken('$5')} />

			<Icon
				color={'$borderColor'}
				name='skip-next'
				onPress={() => useSkip.mutate(undefined)}
				large
			/>

			<Icon
				color={'$borderColor'}
				name='fast-forward-15'
				onPress={() => useSeekBy.mutate(15)}
			/>
		</XStack>
	)
}
