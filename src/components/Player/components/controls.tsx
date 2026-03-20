import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { RepeatMode } from 'react-native-track-player'
import { useToggleShuffle } from '../../../hooks/player/callbacks'
import { useRepeatModeStoreValue, useShuffle } from '../../../stores/player/queue'
import { previous, skip } from '../../../hooks/player/functions/controls'
import { toggleRepeatMode } from '../../../hooks/player/functions/playback'

export default function Controls({
	onLyricsScreen,
}: {
	onLyricsScreen?: boolean
}): React.JSX.Element {
	const repeatMode = useRepeatModeStoreValue()

	const shuffled = useShuffle()

	const toggleShuffle = useToggleShuffle()

	return (
		<XStack alignItems='center' justifyContent='space-between'>
			{!onLyricsScreen && (
				<Icon
					small
					color={shuffled ? '$primary' : '$color'}
					name='shuffle'
					onPress={() => toggleShuffle(shuffled)}
				/>
			)}

			<Spacer />

			<Icon
				name='skip-previous'
				color='$primary'
				onPress={async () => await previous()}
				large
				testID='previous-button-test-id'
			/>

			{/* I really wanted a big clunky play button */}
			<PlayPauseButton size={getToken('$13') - getToken('$9')} />

			<Icon
				name='skip-next'
				color='$primary'
				onPress={async () => await skip(undefined)}
				large
				testID='skip-button-test-id'
			/>

			<Spacer />

			{!onLyricsScreen && (
				<Icon
					small
					color={repeatMode === RepeatMode.Off ? '$color' : '$primary'}
					name={repeatMode === RepeatMode.Track ? 'repeat-once' : 'repeat'}
					onPress={async () => await toggleRepeatMode()}
				/>
			)}
		</XStack>
	)
}
