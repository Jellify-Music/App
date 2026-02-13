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
	FadeInDown,
	FadeOut,
	FadeOutDown,
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	useAnimatedReaction,
	ReduceMotion,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemImage from '../Global/components/image'
import { usePrevious, useSkip } from '../../hooks/player/callbacks'
import { useCurrentTrack } from '../../stores/player/queue'
import getTrackDto from '../../utils/track-extra-payload'

export default function Miniplayer(): React.JSX.Element | null {
	const nowPlaying = useCurrentTrack()
	const item = getTrackDto(nowPlaying)

	const skip = useSkip()
	const previous = usePrevious()
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

	const openPlayer = () => navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })

	const pressStyle = {
		opacity: 0.6,
	}
	if (!nowPlaying) return null

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				collapsable={false}
				testID='miniplayer-test-id'
				entering={FadeInDown.springify()}
				exiting={FadeOutDown.springify()}
			>
				<YStack
					pressStyle={pressStyle}
					animation={'quick'}
					onPress={openPlayer}
					backgroundColor={theme.background.val}
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
									<Text bold>{nowPlaying?.title ?? 'Nothing Playing'}</Text>
								</TextTicker>

								<TextTicker {...TextTickerConfig}>
									<Text height={'$0.5'}>
										{nowPlaying?.artist ?? 'Unknown Artist'}
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

	const handleDisplayPositionChange = (newPosition: number) => {
		if (newPosition === 0) {
			progressValue.value = withTiming(0, {
				duration: 300,
			})
		} else {
			const percentage = calculateProgressPercentage(newPosition, totalDuration)
			progressValue.value = withTiming(percentage, {
				duration: 1000,
				easing: Easing.linear,
				reduceMotion: ReduceMotion.System,
			})
		}
	}

	useAnimatedReaction(
		() => position,
		(cur, prev) => {
			if (cur !== prev) runOnJS(handleDisplayPositionChange)(cur)
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
					},
				]}
			/>
		</YStack>
	)
}

function calculateProgressPercentage(position: number, totalDuration: number): number {
	return (position / totalDuration) * 100
}
