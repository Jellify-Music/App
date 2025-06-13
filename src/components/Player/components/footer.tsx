import { YStack } from 'tamagui'

import { XStack, Spacer } from 'tamagui'

import Icon from '../../Global/components/icon'

import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'
import { useQueueContext } from '../../../providers/Player/queue'
import { shuffleJellifyTracks } from '../shuffle'
import Toast from 'react-native-toast-message'
import { useState } from 'react'
import { JellifyTrack } from '../../../types/JellifyTrack'
import { usePlayerContext } from '../../../providers/Player'
import TrackPlayer from 'react-native-track-player'

export default function Footer({
	navigation,
}: {
	navigation: StackNavigationProp<StackParamList>
}): React.JSX.Element {
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
		<XStack justifyContent='flex-end' alignItems='center' marginHorizontal={'$3.5'}>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<Icon name='speaker-multiple' disabled />
			</XStack>

			<XStack alignItems='center' justifyContent='flex-end' flex={1}>
				<Icon
					name='playlist-music'
					onPress={() => {
						navigation.navigate('Queue')
					}}
				/>
			</XStack>
		</XStack>
	)
}
