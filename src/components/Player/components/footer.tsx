import { YStack } from 'tamagui'

import { XStack, Spacer } from 'tamagui'

import Icon from '../../Global/components/icon'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'
import { useQueueContext } from '../../../providers/Player/queue'
import { shuffleJellifyTracks } from '../shuffle'
import TrackPlayer from 'react-native-track-player'
import Toast from 'react-native-toast-message'
import { useState } from 'react'
import { JellifyTrack } from '@/src/types/JellifyTrack'

export default function Footer({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { playQueue, useSkip, setPlayQueue } = useQueueContext()
	const [originalQueue, setOriginalQueue] = useState<JellifyTrack[]>([])

	const isShuffled = originalQueue?.length > 0
	const handleShuffle = async () => {
		const currentTrackIndex = (await TrackPlayer.getActiveTrackIndex()) ?? 0 // returns track index
		const currentTrackData = playQueue[currentTrackIndex]
		const currentPosition = await TrackPlayer.getProgress()

		// Remove current track and shuffle the rest
		const rest = [
			...playQueue.slice(0, currentTrackIndex),
			...playQueue.slice(currentTrackIndex + 1),
		]
		const { shuffled, original } = shuffleJellifyTracks(rest)
		// Insert the current track back at the same index
		shuffled.splice(currentTrackIndex, 0, currentTrackData)
		original.splice(currentTrackIndex, 0, currentTrackData)
		// Update queue
		setPlayQueue(shuffled)
		setOriginalQueue(original)
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
		setPlayQueue(originalQueue)
		Toast.show({
			text1: 'Deshuffled',
			type: 'success',
		})
		setOriginalQueue([])
	}
	return (
		<YStack justifyContent='flex-end'>
			<XStack justifyContent='space-evenly' marginVertical={'$3'}>
				<Icon name='speaker-multiple' />

				<Spacer />

				<Icon
					name='shuffle'
					color={isShuffled ? '$success' : '$primary'}
					onPress={isShuffled ? handleDeshuffle : handleShuffle}
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
