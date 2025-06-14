import { useJellifyContext } from '../../../providers'
import { usePlayerContext } from '../../../providers/Player'
import { useQueueContext } from '../../../providers/Player/queue'
import { getToken, useWindowDimensions, XStack, YStack, Spacer, useTheme, View } from 'tamagui'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import FastImage from 'react-native-fast-image'
import { Text } from '../../Global/helpers/text'
import { StackNavigationProp } from '@react-navigation/stack'
import Icon from '../../Global/components/icon'
import { StackParamList } from '../../types'
import React from 'react'
import { State } from 'react-native-track-player'

export default function PlayerHeader({
	navigation,
}: {
	navigation: StackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { api } = useJellifyContext()

	const { nowPlaying, playbackState } = usePlayerContext()

	const isPlaying = playbackState === State.Playing

	const { queueRef } = useQueueContext()

	const { width } = useWindowDimensions()

	const theme = useTheme()

	return (
		<YStack flexShrink={1}>
			<XStack marginBottom={'$2'} marginHorizontal={'$2'}>
				<YStack alignContent='flex-end' flex={1} justifyContent='center'>
					<Icon
						name='chevron-down'
						onPress={() => {
							navigation.goBack()
						}}
						small
					/>
				</YStack>

				<YStack alignItems='center' alignContent='center' flex={6}>
					<Text>Playing from</Text>
					<Text bold numberOfLines={1} lineBreakStrategyIOS='standard'>
						{
							// If the Queue is a BaseItemDto, display the name of it
							typeof queueRef === 'object' ? (queueRef.Name ?? 'Untitled') : queueRef
						}
					</Text>
				</YStack>

				<Spacer flex={1} />
			</XStack>

			<XStack justifyContent='center' alignContent='center'>
				<FastImage
					source={{
						uri: getImageApi(api!).getItemImageUrlById(nowPlaying!.item.AlbumId!),
					}}
					style={{
						borderRadius: getToken('$4'),
						width: getToken('$20') * 2,
						height: getToken('$20') * 2,
						shadowRadius: getToken('$4'),
						shadowOffset: {
							width: 0,
							height: -getToken('$4'),
						},
						backgroundColor: theme.borderColor.val,
						alignSelf: 'center',
					}}
				/>
			</XStack>
		</YStack>
	)
}
