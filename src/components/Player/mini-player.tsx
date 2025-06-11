import React from 'react'
import { getToken, getTokens, Image, useTheme, View, XStack, YStack } from 'tamagui'
import { usePlayerContext } from '../../providers/Player'
import { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs'
import { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import Icon from '../Global/components/icon'
import { Text } from '../Global/helpers/text'
import TextTicker from 'react-native-text-ticker'
import PlayPauseButton from './helpers/buttons'
import { TextTickerConfig } from './component.config'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { useQueueContext } from '../../providers/Player/queue'
import { useJellifyContext } from '../../providers'
export function Miniplayer({
	navigation,
}: {
	navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}): React.JSX.Element {
	const theme = useTheme()
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()
	const { useSkip } = useQueueContext()

	return (
		<View
			borderTopLeftRadius={'$2'}
			borderTopRightRadius={'$2'}
			backgroundColor={'$background'}
		>
			{nowPlaying && (
				<XStack
					alignItems='center'
					margin={0}
					padding={0}
					height={'$6'}
					onPress={() => navigation.navigate('Player')}
				>
					<YStack
						justify='center'
						alignItems='flex-start'
						minHeight={'$12'}
						marginLeft={'$2'}
					>
						<FastImage
							source={{
								uri: getImageApi(api!).getItemImageUrlById(
									nowPlaying!.item.AlbumId! || nowPlaying!.item.Id!,
								),
							}}
							style={{
								width: getToken('$12'),
								height: getToken('$12'),
								borderRadius: getToken('$2'),
								backgroundColor: getToken('$color.amethyst'),
								shadowRadius: getToken('$2'),
								shadowOffset: {
									width: 0,
									height: -getToken('$2'),
								},
							}}
						/>
					</YStack>

					<YStack alignContent='flex-start' marginLeft={'$2'} flex={4}>
						<TextTicker {...TextTickerConfig}>
							<Text bold>{nowPlaying?.title ?? 'Nothing Playing'}</Text>
						</TextTicker>

						<TextTicker {...TextTickerConfig}>
							<Text bold color={getTokens().color.telemagenta}>
								{nowPlaying?.artist ?? ''}
							</Text>
						</TextTicker>
					</YStack>

					<XStack justifyContent='flex-end' flex={2}>
						<PlayPauseButton />

						<Icon
							large
							color={'$borderColor'}
							name='skip-next'
							onPress={() => useSkip.mutate(undefined)}
						/>
					</XStack>
				</XStack>
			)}
		</View>
	)
}
