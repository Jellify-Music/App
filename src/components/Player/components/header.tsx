import { XStack, YStack, Spacer, useTheme } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import React, { useMemo } from 'react'
import ItemImage from '../../Global/components/image'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Platform } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../../navigation'
import { useNowPlaying, useQueueRef } from '../../../providers/Player/hooks/queries'

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
					style={{ flex: 1, margin: 'auto' }}
				/>

				<YStack alignItems='center' flex={1}>
					<Text>Playing from</Text>
					<Text bold numberOfLines={1} lineBreakStrategyIOS='standard'>
						{playingFrom}
					</Text>
				</YStack>

				<Spacer flex={1} />
			</XStack>

			<YStack
				flexGrow={1}
				justifyContent='center'
				paddingHorizontal={'$2'}
				maxHeight={'70%'}
				marginVertical={'auto'}
				paddingVertical={Platform.OS === 'android' ? '$4' : '$2'}
			>
				<Animated.View
					entering={FadeIn}
					exiting={FadeOut}
					key={`${nowPlaying!.item.AlbumId}-item-image`}
				>
					<ItemImage item={nowPlaying!.item} testID='player-image-test-id' />
				</Animated.View>
			</YStack>
		</YStack>
	)
}
