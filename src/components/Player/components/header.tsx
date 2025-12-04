import { XStack, YStack, Spacer, useTheme } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import React from 'react'
import ItemImage from '../../Global/components/image'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import { LayoutChangeEvent } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../../navigation'
import { useCurrentTrack, useQueueRef } from '../../../stores/player/queue'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../component.config'

export default function PlayerHeader(): React.JSX.Element {
	const queueRef = useQueueRef()

	const theme = useTheme()

	const playingFrom = !queueRef
		? 'Untitled'
		: typeof queueRef === 'object'
			? (queueRef.Name ?? 'Untitled')
			: queueRef

	return (
		<YStack flexGrow={1} justifyContent='flex-start'>
			<XStack alignContent='flex-start' flexShrink={1} justifyContent='center'>
				<MaterialDesignIcons
					color={theme.color.val}
					name={'chevron-down'}
					size={22}
					onPress={() => navigationRef.goBack()}
					style={{
						marginVertical: 'auto',
						width: 22,
						marginRight: 8,
					}}
				/>

				<YStack alignItems='center' flexGrow={1}>
					<Text>Playing from</Text>
					<TextTicker {...TextTickerConfig}>
						<Text bold numberOfLines={1}>
							{playingFrom}
						</Text>
					</TextTicker>
				</YStack>

				<Spacer marginLeft={8} width={22} />
			</XStack>

			<PlayerArtwork />
		</YStack>
	)
}

function PlayerArtwork(): React.JSX.Element {
	const nowPlaying = useCurrentTrack()

	const artworkMaxHeight = useSharedValue<number>(200)
	const artworkMaxWidth = useSharedValue<number>(200)

	const animatedStyle = useAnimatedStyle(() => ({
		width: withSpring(artworkMaxWidth.get()),
		height: withSpring(artworkMaxWidth.get()),
		opacity: withTiming(nowPlaying ? 1 : 0),
	}))

	const handleLayout = (event: LayoutChangeEvent) => {
		artworkMaxHeight.set(event.nativeEvent.layout.height)
		artworkMaxWidth.set(event.nativeEvent.layout.height)
	}

	return (
		<YStack
			flex={1}
			alignItems='center'
			justifyContent='center'
			paddingHorizontal={'$2'}
			maxHeight={'65%'}
			marginHorizontal={'$4'}
			marginVertical={'auto'}
			onLayout={handleLayout}
		>
			{nowPlaying && (
				<Animated.View
					key={`${nowPlaying!.item.AlbumId}-item-image`}
					style={{
						...animatedStyle,
					}}
				>
					<ItemImage
						item={nowPlaying!.item}
						testID='player-image-test-id'
						imageOptions={{ maxWidth: 800, maxHeight: 800 }}
					/>
				</Animated.View>
			)}
		</YStack>
	)
}
