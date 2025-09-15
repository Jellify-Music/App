import { XStack, YStack, Spacer, useTheme } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import React, { useMemo } from 'react'
import ItemImage from '../../Global/components/image'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Platform } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../../navigation'
import { useNowPlaying, useQueueRef } from '../../../providers/Player/hooks/queries'
import FlipCard from './flip-card'

export default function PlayerHeader(): React.JSX.Element {
	const { data: nowPlaying } = useNowPlaying()

	const { data: queueRef } = useQueueRef()

	const theme = useTheme()

	// If the Queue is a BaseItemDto, display the name of it
	const playingFrom = useMemo(
		() =>
			!queueRef
				? 'Untitled'
				: typeof queueRef === 'object'
					? (queueRef.Name ?? 'Untitled')
					: queueRef,
		[queueRef],
	)

	return (
		<YStack flexGrow={1} justifyContent='flex-start' maxHeight={'80%'}>
			<XStack
				alignContent='flex-start'
				flexShrink={1}
				justifyContent='center'
				onPress={() => navigationRef.goBack()}
			>
				<MaterialDesignIcons
					color={theme.color.val}
					name={Platform.OS === 'android' ? 'chevron-left' : 'chevron-down'}
					size={22}
					style={{ marginVertical: 'auto', width: 22 }}
				/>

				<YStack alignItems='center' flexGrow={1}>
					<Text>Playing from</Text>
					<Text bold numberOfLines={1} lineBreakStrategyIOS='standard'>
						{playingFrom}
					</Text>
				</YStack>

				<Spacer width={22} />
			</XStack>

			<YStack
				flexGrow={1}
				justifyContent='center'
				paddingHorizontal={'$2'}
				maxHeight={'70%'}
				marginVertical={'auto'}
				alignItems='center'
			>
				<Animated.View
					entering={FadeIn}
					exiting={FadeOut}
					key={`${nowPlaying!.item.AlbumId}-flip-card`}
				>
					<FlipCard item={nowPlaying!.item} />
				</Animated.View>
			</YStack>
		</YStack>
	)
}
