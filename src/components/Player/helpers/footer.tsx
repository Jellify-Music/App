import { YStack } from 'tamagui'

import { XStack, Spacer } from 'tamagui'

import Icon from '../../Global/components/icon'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../../components/types'
import { useQueueContext } from '../../../providers/Player/queue'
import { shuffleJellifyTracks } from '../shuffle'
import TrackPlayer from 'react-native-track-player'
import Toast from 'react-native-toast-message'

export default function Footer({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { playQueue, useSkip, setPlayQueue } = useQueueContext()

	const handleShuffle = async () => {
		const currentTrackIndex = (await TrackPlayer.getActiveTrackIndex()) ?? 0 // returns track index
		const currentTrackData = playQueue[currentTrackIndex]
		const currentPosition = await TrackPlayer.getProgress()
		// Remove current track and shuffle the rest
		const rest = [
			...playQueue.slice(0, currentTrackIndex),
			...playQueue.slice(currentTrackIndex + 1),
		]
		const shuffled = shuffleJellifyTracks(rest)
		// Insert the current track back at the same index
		shuffled.splice(currentTrackIndex, 0, currentTrackData)
		// Update queue
		setPlayQueue(shuffled)
		Toast.show({
			text1: 'Shuffled',
			type: 'success',
		})
		//Dont remove this
		// await TrackPlayer.setQueue(shuffled);
		// await TrackPlayer.skip(currentTrackIndex);
		// await TrackPlayer.seekTo(currentPosition.position	); // resume from same position
	}
	return (
		<YStack justifyContent='flex-end'>
			<XStack justifyContent='space-evenly' marginVertical={'$3'}>
				<Icon name='speaker-multiple' />

				<Spacer />

				<Icon name='shuffle' onPress={handleShuffle} />

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
