import { YStack } from 'tamagui'

import { XStack, Spacer } from 'tamagui'

import Icon from '../../Global/components/icon'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../../components/types'
import { useQueueContext } from '../../../providers/Player/queue'
import { shuffleJellifyTracks } from '../shuffle'
import TrackPlayer from 'react-native-track-player'

export default function Footer({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { playQueue, useSkip, setPlayQueue } = useQueueContext()

	const handleShuffle = () => {
		const shuffledQueue = shuffleJellifyTracks(playQueue)
		setPlayQueue(shuffledQueue)
		TrackPlayer.setQueue(shuffledQueue)
		useSkip.mutate(0)
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
