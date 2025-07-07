import { useJellifyContext } from '../../../providers'
import { usePlayerContext } from '../../../providers/Player'
import { useQueueContext } from '../../../providers/Player/queue'
import { getToken, useWindowDimensions, XStack, YStack, Spacer, useTheme, View } from 'tamagui'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import FastImage from 'react-native-fast-image'
import { Text } from '../../Global/helpers/text'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../Global/components/icon'
import { StackParamList } from '../../types'
import React from 'react'
import { State } from 'react-native-track-player'
import { Platform } from 'react-native'
import ItemImage from '../../Global/components/image'

export default function PlayerHeader({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { api } = useJellifyContext()

	const { nowPlaying, playbackState } = usePlayerContext()

	const isPlaying = playbackState === State.Playing

	const { queueRef } = useQueueContext()

	const { width } = useWindowDimensions()

	const theme = useTheme()

	return (
		<YStack flexShrink={1} marginTop={'$2'}>
			<XStack justifyContent='center' marginBottom={'$2'} marginHorizontal={'$2'}>
				<YStack alignContent='center' flex={1} justifyContent='center'>
					<Icon
						name={Platform.OS === 'ios' ? 'chevron-down' : 'chevron-left'}
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
					width={getToken('$20') * 2}
					height={getToken('$20') * 2}
				/>
			</XStack>
		</YStack>
	)
}
