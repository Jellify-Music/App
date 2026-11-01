import { XStack, YStack, Spacer, useTheme, getTokenValue, SizableText } from 'tamagui'
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
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../screens/navigation'
import { useQueueRef, useCurrentTrack } from '../../../stores/player/queue'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../component.config'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { GestureDetector } from 'react-native-gesture-handler'
import { useAlbumCoverGesture } from '../../../hooks/gestures/player'
import SnowCap from '../../Holidays/snow-cap'
import { useHolidayTokens, useIsHolidays } from '../../Holidays/hooks'
import useIsLightMode from '../../../hooks/use-is-light-mode'

/** Design offsets for the title row and the close chevron (design y = 57 vs 24, chevron 74 vs 35) */
const HOLIDAY_HEADER_SHIFT = 33
const HOLIDAY_CHEVRON_SHIFT = 6

export default function PlayerHeader(): React.JSX.Element {
	const queueRef = useQueueRef()

	const theme = useTheme()

	const playingFrom = !queueRef
		? 'Untitled'
		: typeof queueRef === 'object'
			? (queueRef.Name ?? 'Untitled')
			: queueRef

	const isHolidays = useIsHolidays()

	return (
		<YStack flex={1} justifyContent='flex-start'>
			<XStack
				alignContent='flex-start'
				flexShrink={1}
				justifyContent='center'
				// Holidays: the design hangs lights across the top, so the title row sits lower.
				// A transform, so the artwork below keeps its layout position.
				style={
					isHolidays ? { transform: [{ translateY: HOLIDAY_HEADER_SHIFT }] } : undefined
				}
			>
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
						...(isHolidays && { transform: [{ translateY: HOLIDAY_CHEVRON_SHIFT }] }),
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

	const isHolidays = useIsHolidays()
	const isLightMode = useIsLightMode()
	const holidayTokens = useHolidayTokens()

	const item = getTrackDto(nowPlaying)

	const artworkMaxHeight = useSharedValue<number>(200)
	const artworkMaxWidth = useSharedValue<number>(200)

	const animatedStyle = useAnimatedStyle(() => ({
		width: withSpring(artworkMaxWidth.get(), SnappySpringConfig),
		height: withSpring(artworkMaxWidth.get(), SnappySpringConfig),
		// Holidays: the design's softer, deeper drop shadow and 8px corners
		boxShadow: isHolidays
			? [
					{
						offsetX: 0,
						offsetY: 18,
						blurRadius: isLightMode ? 40 : 50,
						color: isLightMode ? 'rgba(20, 32, 26, 0.35)' : 'rgba(0, 0, 0, 0.6)',
					},
				]
			: [
					{
						offsetX: 0,
						offsetY: 2,
						blurRadius: withSpring(artworkMaxWidth.get() / 10, SnappySpringConfig),
						spreadDistance: withSpring(artworkMaxWidth.get() / 25, SnappySpringConfig),
						color: theme.darkBackground75.val,
					},
				],
		borderRadius: isHolidays ? 8 : Math.log(artworkMaxWidth.get()),
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
			<GestureDetector gesture={albumCoverGesture}>
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

						{isHolidays && (
							// Snow draped over the top edge, scaled with the artwork (316 x 40 on 300)
							<View pointerEvents='none' style={styles.snowCap}>
								<SnowCap size='large' fluid color={holidayTokens.cap} />
							</View>
						)}
					</Animated.View>
				)}
			</GestureDetector>
		</YStack>
	)
}

const styles = StyleSheet.create({
	snowCap: {
		position: 'absolute',
		left: '-2.667%',
		top: '-4%',
		width: '105.333%',
		height: '13.333%',
	},
})
