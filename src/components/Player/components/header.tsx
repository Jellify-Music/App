import { useJellifyContext } from '../../../providers'
import { usePlayerContext } from '../../../providers/Player'
import { useQueueRefContext } from '../../../providers/Player/queue'
import { getToken, useWindowDimensions, XStack, YStack, useTheme } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../Global/components/icon'
import { StackParamList } from '../../types'
import React from 'react'
import { State } from 'react-native-track-player'
import ItemImage from '../../Global/components/image'

export default function PlayerHeader({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { api } = useJellifyContext()

	const { nowPlaying, playbackState } = usePlayerContext()

	const isPlaying = playbackState === State.Playing

	const queueRef = useQueueRefContext()

	const { width } = useWindowDimensions()

	const theme = useTheme()

	return (
		<YStack flexShrink={1} marginTop={'$2'}>
			<XStack justifyContent='center' marginBottom={'$2'} marginHorizontal={'$2'}>
				<YStack alignContent='center' flex={1} justifyContent='center'>
					<Icon
						name='chevron-down'
						onPress={() => {
							navigation.goBack()
						}}
						small
					/>
				</YStack>

				<YStack alignItems='center' alignContent='center' flex={8}>
					<Text>Playing from</Text>
					<Text bold numberOfLines={1} lineBreakStrategyIOS='standard'>
						{
							// If the Queue is a BaseItemDto, display the name of it
							typeof queueRef === 'object' ? (queueRef.Name ?? 'Untitled') : queueRef
						}
					</Text>
				</YStack>

				<YStack flex={1} justifyContent='flex-end' alignContent='center'>
					<Icon
						small
						name='dots-vertical'
						onPress={() => {
							navigation.navigate('Details', {
								item: nowPlaying!.item,
								isNested: true,
							})
						}}
					/>
				</YStack>
			</XStack>

			<XStack justifyContent='center' alignContent='center' paddingVertical={'$10'}>
				<ItemImage
					item={nowPlaying!.item}
					testID='player-image-test-id'
					width={getToken('$20') * 2}
					height={getToken('$20') * 2}
				/>
			</XStack>
		</YStack>
	)
}
