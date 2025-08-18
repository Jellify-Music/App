import { useJellifyContext } from '../../../providers'
import { useNowPlayingContext, usePlaybackStateContext } from '../../../providers/Player'
import { useQueueRefContext } from '../../../providers/Player/queue'
import { getToken, useWindowDimensions, XStack, YStack, useTheme, Spacer } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../Global/components/icon'
import { RootStackParamList } from '../../../screens/types'
import React from 'react'
import { State } from 'react-native-track-player'
import ItemImage from '../../Global/components/image'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useNavigation } from '@react-navigation/native'

export default function PlayerHeader(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const nowPlaying = useNowPlayingContext()
	const playbackState = usePlaybackStateContext()

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

				<YStack alignItems='center' alignContent='center' flex={2}>
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

			<XStack justifyContent='center' alignContent='center' paddingVertical={'$8'}>
				<Animated.View
					entering={FadeIn}
					exiting={FadeOut}
					key={`${nowPlaying!.item.AlbumId}-item-image`}
				>
					<ItemImage
						item={nowPlaying!.item}
						testID='player-image-test-id'
						width={getToken('$20') * 2}
						height={getToken('$20') * 2}
					/>
				</Animated.View>
			</XStack>
		</YStack>
	)
}
