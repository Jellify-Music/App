import React from 'react'
import { Progress, XStack, YStack } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import TextTicker from 'react-native-text-ticker'
import { PlayPauseIcon } from './components/buttons'
import { TextTickerConfig } from './component.config'
import { UPDATE_INTERVAL } from '../../configs/player.config'
import { Progress as TrackPlayerProgress } from 'react-native-track-player'
import { useProgress } from '../../providers/Player/hooks/queries'

import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	Easing,
	FadeIn,
	FadeInDown,
	FadeOut,
	FadeOutDown,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemImage from '../Global/components/image'
import { usePrevious, useSkip } from '../../providers/Player/hooks/mutations'
import { useCurrentTrack } from '../../stores/player/queue'

export default function Miniplayer(): React.JSX.Element {
	const nowPlaying = useCurrentTrack()
	const skip = useSkip()
	const previous = usePrevious()

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
				translateX.value = withSpring(200)
			} else if (event.translationX < -threshold) {
				runOnJS(handleSwipe)('Swiped Left')
				translateX.value = withSpring(-200)
			} else if (event.translationY < -threshold) {
				runOnJS(handleSwipe)('Swiped Up')
				translateY.value = withSpring(-200)
			} else {
				translateX.value = withSpring(0)
				translateY.value = withSpring(0)
			}
		})

	const openPlayer = () => navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })

	const pressStyle = {
		opacity: 0.6,
	}

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				collapsable={false}
				testID='miniplayer-test-id'
				entering={FadeInDown.easing(Easing.in(Easing.ease))}
				exiting={FadeOutDown.easing(Easing.out(Easing.ease))}
			>
				<YStack>
					<MiniPlayerProgress />
					<XStack
						alignItems='center'
						pressStyle={pressStyle}
						animation={'quick'}
						onPress={openPlayer}
						paddingVertical={'$2'}
					>
						<YStack justify='center' alignItems='center' marginLeft={'$2'}>
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
								key={`${nowPlaying!.item.AlbumId}-album-image`}
							>
								<ItemImage
									item={nowPlaying!.item}
									width={'$11'}
									height={'$11'}
									imageOptions={{ maxWidth: 200, maxHeight: 200 }}
								/>
							</Animated.View>
						</YStack>

						<YStack
							alignContent='flex-start'
							justifyContent='center'
							marginLeft={'$2'}
							flex={6}
						>
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
								key={`${nowPlaying!.item.Id}-mini-player-song-info`}
								style={{
									width: '100%',
								}}
							>
								<TextTicker {...TextTickerConfig}>
									<Text bold width={'100%'}>
										{nowPlaying?.title ?? 'Nothing Playing'}
									</Text>
								</TextTicker>

								<TextTicker {...TextTickerConfig}>
									<Text height={'$0.5'} width={'100%'}>
										{nowPlaying?.artist ?? 'Unknown Artist'}
									</Text>
								</TextTicker>
							</Animated.View>
						</YStack>

						<XStack
							justifyContent='flex-end'
							alignItems='center'
							flex={2}
							marginRight={'$2'}
						>
							<PlayPauseIcon />
						</XStack>
					</XStack>
				</YStack>
			</Animated.View>
		</GestureDetector>
	)
}

function MiniPlayerProgress(): React.JSX.Element {
	const progress = useProgress(UPDATE_INTERVAL)

	return (
		<Progress
			height={'$0.25'}
			value={calculateProgressPercentage(progress)}
			backgroundColor={'$borderColor'}
			borderBottomEndRadius={'$2'}
		>
			<Progress.Indicator borderColor={'$primary'} backgroundColor={'$primary'} />
		</Progress>
	)
}

function calculateProgressPercentage(progress: TrackPlayerProgress | undefined): number {
	return Math.round((progress!.position / progress!.duration) * 100)
}
