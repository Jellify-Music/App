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
	return (
		<XStack justifyContent='flex-end' alignItems='center' marginHorizontal={'$4'}>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<Icon small name='speaker-multiple' disabled />
			</XStack>

			<XStack alignItems='center' justifyContent='flex-end' flex={1}>
				<Icon
					small
					name='playlist-music'
					onPress={() => {
						navigation.navigate('Queue')
					}}
				/>
			</XStack>
		</XStack>
	)
}
