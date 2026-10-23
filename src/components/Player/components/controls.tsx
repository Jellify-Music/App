import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { useRepeatMode, useShuffle } from '../../../stores/player/queue'
import { toggleRepeatMode } from '../../../player/controls/repeat-mode'
import { toggleShuffle } from '../../../player/controls/shuffle'
import { previous, skip } from '../../../player/controls'

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
					size='7'
					color={shuffled ? 'primary' : 'color'}
					name='shuffle'
					onPress={async () => await toggleShuffle()}
				/>
			)}

			<Spacer />

			<Icon
				name='skip-previous'
				color='primary'
				onPress={async () => await previous()}
				size='10'
				testID='previous-button-test-id'
			/>

			{/* I really wanted a big clunky play button */}
			<PlayPauseButton />

			<Icon
				name='skip-next'
				color='primary'
				onPress={async () => await skip(undefined)}
				size='10'
				testID='skip-button-test-id'
			/>

			<Spacer />

			{!onLyricsScreen && (
				<Icon
					size='7'
					color={repeatMode === 'off' ? 'color' : 'primary'}
					name={repeatMode === 'track' ? 'repeat-once' : 'repeat'}
					onPress={toggleRepeatMode}
				/>
			)}
		</XStack>
	)
}
