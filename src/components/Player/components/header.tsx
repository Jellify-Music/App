import { XStack, YStack, Spacer, useTheme } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import React, { useCallback, useMemo, useRef } from 'react'
import ItemImage from '../../Global/components/image'
import Animated, {
	FadeIn,
	FadeOut,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated'
import { LayoutChangeEvent, Platform, View } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../../navigation'
import { useCurrentTrack, useQueueRef } from '../../../stores/player/queue'

export default function PlayerHeader(): React.JSX.Element {
	const queueRef = useQueueRef()

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

			<PlayerArtwork />
		</YStack>
	)
}

function PlayerArtwork(): React.JSX.Element {
	const nowPlaying = useCurrentTrack()

	const artworkMaxHeight = '65%'

	const artworkMaxWidth = useSharedValue<number>(300)

	const artworkContainerRef = useRef<View>(null)

	const animatedStyle = useAnimatedStyle(() => ({
		width: artworkMaxWidth.get(),
	}))

	const handleLayout = useCallback((event: LayoutChangeEvent) => {
		artworkMaxWidth.set(event.nativeEvent.layout.height)
	}, [])

	return (
		<YStack
			ref={artworkContainerRef}
			flex={1}
			alignItems='center'
			justifyContent='center'
			paddingHorizontal={'$2'}
			maxHeight={artworkMaxHeight}
			marginVertical={'auto'}
			onLayout={handleLayout}
		>
			{nowPlaying && (
				<Animated.View
					entering={FadeIn}
					exiting={FadeOut}
					key={`${nowPlaying!.item.AlbumId}-item-image`}
					style={{ flex: 1, ...animatedStyle }}
				>
					<ItemImage item={nowPlaying!.item} testID='player-image-test-id' />
				</Animated.View>
			)}
		</YStack>
	)
}
