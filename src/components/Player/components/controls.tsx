import React from 'react'
import { Spacer, XStack, getToken } from 'tamagui'
import PlayPauseButton from './buttons'
import Icon from '../../Global/components/icon'
import { usePlayerContext } from '../../../providers/Player'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useQueueContext } from '../../../providers/Player/queue'
import TrackPlayer from 'react-native-track-player'
import Toast from 'react-native-toast-message'
import { shuffleJellifyTracks } from '../shuffle'

export default function Controls(): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	const { useSeekBy } = usePlayerContext()

	const { usePrevious, useSkip } = useQueueContext()
	const { nowPlaying } = usePlayerContext()

	const {
		playQueue,
		setPlayQueue,
		currentIndex,
		setCurrentIndex,
		shuffled,
		setShuffled,
		unshuffledQueue,
	} = useQueueContext()

	const handleShuffle = async () => {
		// Remove current track and shuffle the rest
		const rest = [...playQueue.slice(0, currentIndex), ...playQueue.slice(currentIndex + 1)]
		const { shuffled, original } = shuffleJellifyTracks(rest)

		// Insert the current track at the start of the queue
		shuffled.splice(0, 0, nowPlaying!)
		original.splice(0, 0, nowPlaying!)
		// Update queue
		setShuffled(true)
		setPlayQueue(shuffled)
		setCurrentIndex(0)
		await TrackPlayer.move(currentIndex, 0)
		await TrackPlayer.removeUpcomingTracks()
		await TrackPlayer.add(shuffled.slice(1))
		Toast.show({
			text1: 'Shuffled',
			type: 'success',
		})
		//Dont remove this
		// await TrackPlayer.setQueue(shuffled);
		// await TrackPlayer.skip(currentTrackIndex);
		// await TrackPlayer.seekTo(currentPosition.position	); // resume from same position
	}

	const handleDeshuffle = async () => {
		setPlayQueue(unshuffledQueue)
		setShuffled(false)
		await TrackPlayer.move(currentIndex, 0)
		await TrackPlayer.removeUpcomingTracks()

		/**
		 * Find the index of the current track in the original queue
		 */
		const originalQueueIndex = unshuffledQueue.findIndex(
			(track) => track.item.Id === nowPlaying?.item.Id,
		)

		await TrackPlayer.add([
			...unshuffledQueue.slice(0, originalQueueIndex),
			...unshuffledQueue.slice(originalQueueIndex),
		])
		await TrackPlayer.move(0, originalQueueIndex)
		setCurrentIndex(originalQueueIndex)

		Toast.show({
			text1: 'Deshuffled',
			type: 'success',
		})
	}

	return (
		<XStack alignItems='center' justifyContent='space-evenly' flexShrink={1} flexGrow={0.5}>
			<Icon
				small
				color={shuffled ? '$primary' : '$color'}
				name='shuffle'
				onPress={() => (shuffled ? handleDeshuffle : handleShuffle)}
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
