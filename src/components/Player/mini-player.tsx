import React from 'react'
import { useTheme, XStack, YStack } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import TextTicker from 'react-native-text-ticker'
import { PlayPauseIcon } from './components/buttons'
import { TextTickerConfig } from './component.config'
import { useProgress } from '../../hooks/player'

import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	Easing,
	FadeIn,
	FadeOut,
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	useAnimatedReaction,
	ReduceMotion,
	SlideInDown,
	SlideOutDown,
	interpolate,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemImage from '../Global/components/image'
import { useCurrentTrack } from '../../stores/player/queue'
import getTrackDto, { getTypedExtraPayload } from '../../utils/mapping/track-extra-payload'
import { ICON_PRESS_STYLES } from '../../configs/style.config'
import { previous, skip } from '../../hooks/player/functions/controls'

export default function Miniplayer(): React.JSX.Element | null {
	const nowPlaying = useCurrentTrack()
	const item = getTrackDto(nowPlaying)
	const payload = getTypedExtraPayload(nowPlaying)

	const theme = useTheme()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const translateX = useSharedValue(0)
	const translateY = useSharedValue(0)

	const handleSwipe = (direction: string) => {
		if (direction === 'Swiped Left') {
			// Inverted: Swipe left -> next
			skip(undefined)
		} else if (direction === 'Swiped Right') {
			// Inverted: Swipe right -> previous
			previous()
		} else if (direction === 'Swiped Up') {
			// Navigate to the big player
			navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
		}
	}

	const gesture = Gesture.Pan()
		.onUpdate((event) => {
			translateX.value = event.translationX
			translateY.value = event.translationY
		})
		.onEnd((event) => {
			const threshold = 100

			if (event.translationX > threshold) {
				runOnJS(handleSwipe)('Swiped Right')
				translateX.value = 200
			} else if (event.translationX < -threshold) {
				runOnJS(handleSwipe)('Swiped Left')
				translateX.value = -200
			} else if (event.translationY < -threshold) {
				runOnJS(handleSwipe)('Swiped Up')
				translateY.value = -200
			} else {
				translateX.value = 0
				translateY.value = 0
			}
		})

	const openPlayer = () => {
		navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
	}

	if (!nowPlaying) return null

	// Guard: during track transitions nowPlaying can be briefly null
	if (!item) {
		return (
			<YStack
				backgroundColor={theme.background.val}
				padding={'$2'}
				alignItems='center'
				justifyContent='center'
			>
				<Text> </Text>
			</YStack>
		)
	}

	const customBlurhash = typeof payload?.blurhash === 'string' ? payload.blurhash : undefined

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				collapsable={false}
				testID='miniplayer-test-id'
				entering={SlideInDown.springify()}
				exiting={SlideOutDown.springify()}
			>
				<YStack
					onPress={openPlayer}
					backgroundColor={theme.background.val}
					{...ICON_PRESS_STYLES}
				>
					<MiniPlayerProgress />
					<XStack alignItems='center' padding={'$2'}>
						<YStack justify='center' alignItems='center'>
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
							>
								<ItemImage
									item={item!}
									customBlurhash={customBlurhash}
									width={'$11'}
									height={'$11'}
									imageOptions={{ maxWidth: 120, maxHeight: 120 }}
								/>
							</Animated.View>
						</YStack>

						<YStack
							alignContent='flex-start'
							justifyContent='center'
							marginHorizontal={'$2'}
							flex={1}
						>
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
								key={`${nowPlaying!.id}-mini-player-song-info`}
							>
								<TextTicker {...TextTickerConfig}>
									<Text bold>{nowPlaying.title ?? 'Nothing Playing'}</Text>
								</TextTicker>

								<TextTicker {...TextTickerConfig}>
									<Text height={'$0.5'}>
										{nowPlaying.artist ?? 'Unknown Artist'}
									</Text>
								</TextTicker>
							</Animated.View>
						</YStack>

						<XStack justifyContent='center' alignItems='center' flexShrink={1}>
							<PlayPauseIcon />
						</XStack>
					</XStack>
				</YStack>
			</Animated.View>
		</GestureDetector>
	)
}

function MiniPlayerProgress(): React.JSX.Element {
	const { position, totalDuration } = useProgress()
	const theme = useTheme()
	const progressValue = useSharedValue(position === 0 ? 0 : (position / totalDuration) * 100)

	const handleDisplayPositionChange = (newPosition: number, prevPosition: number | null) => {
		const timingDuration =
			Math.round(Math.abs(newPosition - (prevPosition ?? 0))) === 1 ? 1000 : 200

		progressValue.value = withTiming(interpolate(newPosition, [0, totalDuration], [0, 100]), {
			duration: timingDuration,
			easing: Easing.linear,
			reduceMotion: ReduceMotion.Never,
		})
	}

	useAnimatedReaction(
		() => position,
		(cur, prev) => {
			if (cur !== prev) runOnJS(handleDisplayPositionChange)(cur, prev)
		},
	)

	const animatedStyle = useAnimatedStyle(() => ({
		width: `${progressValue.value}%`,
	}))

	return (
		<YStack height={'$0.25'} backgroundColor={'$borderColor'} width={'100%'}>
			<Animated.View
				style={[
					animatedStyle,
					{
						height: '100%',
						backgroundColor: theme.primary.val,
						shadowColor: theme.background.val,
						shadowOffset: { width: 2, height: 1 },
						shadowOpacity: 0.75,
						shadowRadius: 1,
						borderRadius: 4,
					},
				]}
			/>
		</YStack>
	)
}

function calculateProgressPercentage(position: number, totalDuration: number): number {
	return (position / totalDuration) * 100
}
