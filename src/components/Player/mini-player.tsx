import React, { useMemo, useCallback } from 'react'
import {
	getToken,
	getTokenValue,
	Progress,
	useTheme,
	useWindowDimensions,
	View,
	XStack,
	YStack,
	ZStack,
} from 'tamagui'
import { usePlayerContext } from '../../providers/Player'
import { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs'
import { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import Icon from '../Global/components/icon'
import { Text } from '../Global/helpers/text'
import TextTicker from 'react-native-text-ticker'
import PlayPauseButton from './components/buttons'
import { ProgressMultiplier, TextTickerConfig } from './component.config'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { useQueueContext } from '../../providers/Player/queue'
import { useJellifyContext } from '../../providers'
import { RunTimeSeconds } from '../Global/helpers/time-codes'
import { UPDATE_INTERVAL } from '../../player/config'
import { useProgress, Progress as TrackPlayerProgress } from 'react-native-track-player'
import BlurredBackground from './components/blurred-background'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useSharedValue, withSpring } from 'react-native-reanimated'
export const Miniplayer = React.memo(function Miniplayer({
	navigation,
}: {
	navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}): React.JSX.Element {
	const theme = useTheme()
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()
	const { useSkip, usePrevious } = useQueueContext()
	// Get progress from the track player with the specified update interval
	const progress = useProgress(UPDATE_INTERVAL, false)

	const { width } = useWindowDimensions()
	const translateX = useSharedValue(0)
	const translateY = useSharedValue(0)

	const handleSwipe = useCallback(
		(direction: string) => {
			if (direction === 'Swiped Left') {
				// Skip to previous song
				usePrevious.mutate()
			} else if (direction === 'Swiped Right') {
				// Skip to next song
				useSkip.mutate(undefined)
			} else if (direction === 'Swiped Up') {
				// Navigate to the big player
				navigation.navigate('Player')
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
		<ZStack height={'$7'} testID='miniplayer-test-id'>
			{nowPlaying && (
				<>
					<GestureDetector gesture={gesture}>
						<YStack>
							<Progress
								size={'$1'}
								value={calculateProgressPercentage(progress)}
								backgroundColor={'$borderColor'}
								borderRadius={0}
							>
								<Progress.Indicator
									borderColor={'$primary'}
									backgroundColor={'$primary'}
								/>
							</Progress>

							<XStack
								alignItems='flex-start'
								margin={0}
								padding={0}
								height={'$7'}
								onPress={() => navigation.navigate('Player')}
							>
								<YStack
									justify='center'
									alignItems='center'
									minHeight={'$6'}
									paddingTop={'$1.5'}
									marginLeft={'$2'}
								>
									{api && (
										<FastImage
											source={{
												uri: getImageApi(api)?.getItemImageUrlById(
													nowPlaying!.item.AlbumId! ||
														nowPlaying!.item.Id!,
												),
											}}
											style={{
												width: getToken('$12'),
												height: getToken('$12'),
												borderRadius: getToken('$2'),
												backgroundColor: '$borderColor',
												shadowRadius: getToken('$2'),
												shadowOffset: {
													width: 0,
													height: -getToken('$2'),
												},
											}}
										/>
									)}
								</YStack>

								<YStack alignContent='flex-start' marginLeft={'$2'} flex={6}>
									<XStack gap={'$1'} justifyContent='flex-start' height={'$1'}>
										<RunTimeSeconds alignment='left'>
											{Math.max(0, Math.floor(progress?.position ?? 0))}
										</RunTimeSeconds>

										<Text
											color={'$neutral'}
											textAlign='center'
											marginRight={'$1'}
										>
											/
										</Text>

										<RunTimeSeconds color={'$neutral'} alignment='right'>
											{Math.max(0, Math.floor(progress?.duration ?? 0))}
										</RunTimeSeconds>
									</XStack>

									<TextTicker
										{...TextTickerConfig}
										style={{ height: getToken('$8') }}
									>
										<Text bold>{nowPlaying?.title ?? 'Nothing Playing'}</Text>
									</TextTicker>

									<TextTicker
										{...TextTickerConfig}
										style={{ height: getToken('$8') }}
									>
										<Text height={'$0.5'}>{nowPlaying?.artist ?? ''}</Text>
									</TextTicker>
								</YStack>

								<XStack
									justifyContent='flex-end'
									alignItems='center'
									flex={2}
									marginRight={'$2'}
									height={'$6'}
								>
									<PlayPauseButton size={getToken('$12')} />
								</XStack>
							</XStack>
						</YStack>
					</GestureDetector>
				</>
			)}
		</ZStack>
	)
})

function calculateProgressPercentage(progress: TrackPlayerProgress | undefined): number {
	return Math.round(
		((progress!.position * ProgressMultiplier) / (progress!.duration * ProgressMultiplier)) *
			100,
	)
}
