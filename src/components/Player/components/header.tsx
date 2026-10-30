import { XStack, YStack, Spacer, useTheme, SizableText, View } from 'tamagui'
import React from 'react'
import ItemImage from '../../Global/components/image'
import Animated, {
	Easing,
	FadeIn,
	FadeOut,
	SnappySpringConfig,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { LayoutChangeEvent } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../screens/navigation'
import { useQueueRef, useCurrentTrack } from '../../../stores/player/queue'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../component.config'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { GestureDetector } from 'react-native-gesture-handler'
import { useAlbumCoverGesture } from '../../../hooks/gestures/player'

export default function PlayerHeader(): React.JSX.Element {
	const queueRef = useQueueRef()

	const theme = useTheme()

	const playingFrom = !queueRef
		? 'Untitled'
		: typeof queueRef === 'object'
			? (queueRef.Name ?? 'Untitled')
			: queueRef

	return (
		<YStack flex={1} justifyContent='flex-start'>
			<XStack alignContent='flex-start' flexShrink={1} justifyContent='center'>
				<MaterialDesignIcons
					color={theme.color.val}
					name={'chevron-down'}
					size={22}
					onPress={() => navigationRef.goBack()}
					testID='player-close-button'
					accessibilityLabel='Close player'
					style={{
						marginVertical: 'auto',
						width: 22,
						marginRight: 8,
					}}
				/>

				<YStack alignItems='center' flexGrow={1}>
					<SizableText fontSize={'2'}>Playing from</SizableText>
					<TextTicker {...TextTickerConfig}>
						<SizableText fontWeight='6' numberOfLines={1} fontSize='2'>
							{playingFrom}
						</SizableText>
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

	const albumCoverGesture = useAlbumCoverGesture()

	const theme = useTheme()

	const item = getTrackDto(nowPlaying)

	const artworkMaxHeight = useSharedValue<number>(200)
	const artworkMaxWidth = useSharedValue<number>(200)

	const animatedStyle = useAnimatedStyle(() => ({
		width: withSpring(artworkMaxWidth.get(), SnappySpringConfig),
		height: withSpring(artworkMaxWidth.get(), SnappySpringConfig),
		boxShadow: [
			{
				offsetX: 0,
				offsetY: 2,
				blurRadius: withSpring(artworkMaxWidth.get() / 10, SnappySpringConfig),
				spreadDistance: withSpring(artworkMaxWidth.get() / 25, SnappySpringConfig),
				color: theme.darkBackground75.val,
			},
		],
		borderRadius: Math.log(artworkMaxWidth.get()),
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
			paddingHorizontal='2'
			maxHeight={'60%'}
			marginHorizontal='4'
			marginVertical={'auto'}
			onLayout={handleLayout}
		>
			{/* The native gesture requires the detector to have exactly one stable child, so key the artwork inside it */}
			<GestureDetector gesture={albumCoverGesture}>
				<View>
					{nowPlaying && item && (
						<Animated.View
							collapsable={false}
							style={animatedStyle}
							entering={FadeIn.easing(Easing.in(Easing.ease))}
							exiting={FadeOut.easing(Easing.out(Easing.ease))}
							key={`${item.AlbumId}-item-image`}
						>
							<ItemImage
								item={item}
								testID='player-image-test-id'
								imageOptions={{ maxWidth: 800, maxHeight: 800 }}
							/>
						</Animated.View>
					)}
				</View>
			</GestureDetector>
		</YStack>
	)
}
