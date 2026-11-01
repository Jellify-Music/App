import { YStack, useTheme, View } from 'tamagui'
import React from 'react'
import { usePlayerContext } from '../../../providers/Player'
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
import { LayoutChangeEvent, StyleSheet } from 'react-native'
import { useCurrentTrack } from '../../../stores/player/queue'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { GestureDetector } from 'react-native-gesture-handler'
import { useAlbumCoverGesture } from '../../../hooks/gestures/player'
import Lyrics from '../../Lyrics/lyrics'

export default function PlayerContent(): React.JSX.Element {
	const { displayLyrics } = usePlayerContext()

	return (
		<YStack flex={1} justifyContent='flex-start'>
			<View flex={1} maxHeight='67%' marginVertical={'auto'}>
				{displayLyrics ? <Lyrics /> : <PlayerArtwork />}
			</View>
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
			marginHorizontal='4'
			onLayout={handleLayout}
		>
			<GestureDetector gesture={albumCoverGesture}>
				<View justifyContent='center' alignItems='center' style={StyleSheet.absoluteFill}>
					{nowPlaying && item && (
						<Animated.View
							entering={FadeIn.easing(Easing.in(Easing.ease))}
							exiting={FadeOut.easing(Easing.out(Easing.ease))}
							key={`${nowPlaying.id}-item-image`}
							style={{
								...animatedStyle,
							}}
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
