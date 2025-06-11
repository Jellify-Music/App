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
		// Insert the current track back at the same index
		shuffled.splice(currentIndex, 0, nowPlaying!)
		original.splice(currentIndex, 0, nowPlaying!)
		// Update queue
		setShuffled(true)
		setPlayQueue(shuffled)
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
		await TrackPlayer.removeUpcomingTracks()

		/**
		 * Find the index of the current track in the original queue
		 */
		const originalQueueIndex = unshuffledQueue.findIndex(
			(track) => track.item.Id === nowPlaying?.item.Id,
		)

		await TrackPlayer.add([
			...unshuffledQueue.slice(0, originalQueueIndex),
			...playQueue.slice(originalQueueIndex),
		])
		await TrackPlayer.move(currentIndex, originalQueueIndex)
		setCurrentIndex(originalQueueIndex)

		Toast.show({
			text1: 'Deshuffled',
			type: 'success',
		})
	}
	return (
		<YStack justifyContent='flex-end'>
			<XStack justifyContent='space-evenly' marginVertical={'$3'}>
				<Icon name='speaker-multiple' />

				<Spacer />

				<Icon
					name='shuffle'
					color={shuffled ? '$success' : '$primary'}
					onPress={shuffled ? handleDeshuffle : handleShuffle}
				/>

				<Spacer />

				<Icon
					name='playlist-music'
					onPress={() => {
						navigation.navigate('Queue')
					}}
				/>
			</XStack>
		</YStack>
	)
}
