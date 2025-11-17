import { XStack, YStack, Spacer, useTheme, TamaguiComponent } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import ItemImage from '../../Global/components/image'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Platform, View } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../../navigation'
import { useCurrentTrack, useQueueRef } from '../../../stores/player/queue'

export default function PlayerHeader(): React.JSX.Element {
	const nowPlaying = useCurrentTrack()

	const queueRef = useQueueRef()

	const artworkContainerRef = useRef<View>(null)

	const theme = useTheme()

	const artworkMaxHeight = '65%'

	const [artworkMaxWidth, setArtworkMaxWidth] = useState<number>(0)

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

	useLayoutEffect(() => {
		artworkContainerRef.current?.measure((x, y, width, height) => {
			setArtworkMaxWidth(height)
		})
	})

	return (
		<YStack flexGrow={1} justifyContent='flex-start'>
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
				ref={artworkContainerRef}
				flexGrow={1}
				alignContent='center'
				justifyContent='center'
				paddingHorizontal={'$2'}
				maxHeight={artworkMaxHeight}
				maxWidth={artworkMaxWidth}
				marginVertical={'auto'}
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
