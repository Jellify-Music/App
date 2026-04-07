import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { useRepeatMode, useShuffle } from '../../../stores/player/queue'
import { toggleRepeatMode } from '../../../hooks/player/functions/repeat-mode'
import { toggleShuffle } from '../../../hooks/player/functions/shuffle'
import { previous, skip } from '../../../hooks/player/functions/controls'

export default function Controls({
	onLyricsScreen,
}: {
	onLyricsScreen?: boolean
}): React.JSX.Element {
	const repeatMode = useRepeatMode()

	const shuffled = useShuffle()

	return (
		<XStack alignItems='center' justifyContent='space-between'>
			{!onLyricsScreen && (
				<Icon
					small
					color={shuffled ? '$primary' : '$color'}
					name='shuffle'
					onPress={async () => await toggleShuffle()}
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
					color={repeatMode === 'off' ? '$color' : '$primary'}
					name={repeatMode === 'track' ? 'repeat-once' : 'repeat'}
					onPress={toggleRepeatMode}
				/>
			)}
		</XStack>
	)
}
