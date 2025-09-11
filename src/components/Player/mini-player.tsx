import React, { useMemo, useCallback } from 'react'
import { getToken, Progress, View, XStack, YStack, ZStack } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import TextTicker from 'react-native-text-ticker'
import PlayPauseButton from './components/buttons'
import { TextTickerConfig } from './component.config'
import { useJellifyContext } from '../../providers'
import { RunTimeSeconds } from '../Global/helpers/time-codes'
import { MINIPLAYER_UPDATE_INTERVAL } from '../../player/config'
import { Progress as TrackPlayerProgress } from 'react-native-track-player'
import { useProgress } from '../../providers/Player/hooks/queries'

import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	FadeIn,
	FadeOut,
	runOnJS,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemImage from '../Global/components/image'
import { useNowPlaying } from '../../providers/Player/hooks/queries'
import { usePrevious, useSkip } from '../../providers/Player/hooks/mutations'

export const Miniplayer = React.memo(function Miniplayer(): React.JSX.Element {
	const { data: nowPlaying } = useNowPlaying()
	const { mutate: skip } = useSkip()
	const { mutate: previous } = usePrevious()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const translateX = useSharedValue(0)
	const translateY = useSharedValue(0)

	const handleSwipe = useCallback(
		(direction: string) => {
			if (direction === 'Swiped Left') {
				// Skip to previous song
				previous()
			} else if (direction === 'Swiped Right') {
				// Skip to next song
				skip(undefined)
			} else if (direction === 'Swiped Up') {
				// Navigate to the big player
				navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
			}
		},
		[useSkip, usePrevious, navigation],
	)

	const gesture = useMemo(
		() =>
			Gesture.Pan()
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
				}),
		[translateX, translateY, handleSwipe],
	)

	return (
		<View testID='miniplayer-test-id' borderTopWidth={'$0.75'} borderColor={'$borderColor'}>
			{nowPlaying && (
				<GestureDetector gesture={gesture}>
					<YStack>
						<XStack
							paddingVertical={'$1'}
							alignItems='center'
							onPress={() =>
								navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
							}
						>
							<YStack justify='center' alignItems='center' marginLeft={'$2'}>
								<Animated.View
									entering={FadeIn}
									exiting={FadeOut}
									key={`${nowPlaying!.item.AlbumId}-album-image`}
								>
									<ItemImage
										item={nowPlaying!.item}
										width={'$12'}
										height={'$12'}
									/>
								</Animated.View>
							</YStack>

							<YStack
								alignContent='flex-start'
								justifyContent='center'
								marginLeft={'$2'}
								flex={6}
							>
								<MiniPlayerRuntime />

								<Animated.View
									entering={FadeIn}
									exiting={FadeOut}
									key={`${nowPlaying!.item.AlbumId}-mini-player-song-info`}
								>
									<View width={'100%'}>
										<TextTicker {...TextTickerConfig}>
											<Text bold width={'100%'}>
												{nowPlaying?.title ?? 'Nothing Playing'}
											</Text>
										</TextTicker>

										<TextTicker {...TextTickerConfig}>
											<Text height={'$0.5'} width={'100%'}>
												{nowPlaying?.artist ?? ''}
											</Text>
										</TextTicker>
									</View>
								</Animated.View>
							</YStack>

							<XStack
								justifyContent='flex-end'
								alignItems='center'
								flex={2}
								marginRight={'$2'}
							>
								<PlayPauseButton size={getToken('$12')} />
							</XStack>
						</XStack>

						<MiniPlayerProgress />
					</YStack>
				</GestureDetector>
			)}
		</View>
	)
})

function MiniPlayerRuntime(): React.JSX.Element {
	const { position } = useProgress(MINIPLAYER_UPDATE_INTERVAL)
	const { data: nowPlaying } = useNowPlaying()
	const { duration } = nowPlaying!

	return (
		<Animated.View
			entering={FadeIn}
			exiting={FadeOut}
			key={`${nowPlaying!.item.AlbumId}-mini-player-runtime`}
		>
			<XStack gap={'$1'} justifyContent='flex-start' height={'$1'}>
				<YStack justifyContent='center' marginRight={'$2'} paddingRight={'auto'}>
					<RunTimeSeconds alignment='left'>
						{Math.max(0, Math.floor(position))}
					</RunTimeSeconds>
				</YStack>

				<Text color={'$neutral'} textAlign='center'>
					/
				</Text>

				<YStack justifyContent='center' marginLeft={'$2'}>
					<RunTimeSeconds color={'$neutral'} alignment='right'>
						{Math.max(0, Math.floor(duration))}
					</RunTimeSeconds>
				</YStack>
			</XStack>
		</Animated.View>
	)
}

function MiniPlayerProgress(): React.JSX.Element {
	const progress = useProgress(MINIPLAYER_UPDATE_INTERVAL)

	return (
		<Progress
			size={'$0.75'}
			value={calculateProgressPercentage(progress)}
			backgroundColor={'$borderColor'}
			borderRadius={0}
		>
			<Progress.Indicator borderColor={'$primary'} backgroundColor={'$primary'} />
		</Progress>
	)
}

function calculateProgressPercentage(progress: TrackPlayerProgress | undefined): number {
	return Math.round((progress!.position / progress!.duration) * 100)
}
