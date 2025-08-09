import React, { useMemo, useCallback } from 'react'
import {
	getToken,
	Progress,
	Spacer,
	useWindowDimensions,
	View,
	XStack,
	YStack,
	ZStack,
} from 'tamagui'
import { usePlayerContext } from '../../providers/Player'
import { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs'
import { NavigationHelpers, ParamListBase } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import TextTicker from 'react-native-text-ticker'
import PlayPauseButton from './components/buttons'
import { ProgressMultiplier, TextTickerConfig } from './component.config'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { usePreviousContext, useSkipContext } from '../../providers/Player/queue'
import { useJellifyContext } from '../../providers'
import { RunTimeSeconds } from '../Global/helpers/time-codes'
import { UPDATE_INTERVAL } from '../../player/config'
import { useProgress, Progress as TrackPlayerProgress } from 'react-native-track-player'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useSharedValue, withSpring } from 'react-native-reanimated'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'

export const Miniplayer = React.memo(function Miniplayer({
	navigation,
}: {
	navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}): React.JSX.Element {
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()
	const useSkip = useSkipContext()
	const usePrevious = usePreviousContext()
	// Get progress from the track player with the specified update interval
	const progress = useProgress(UPDATE_INTERVAL)

	const { width } = useWindowDimensions()
	const translateX = useSharedValue(0)
	const translateY = useSharedValue(0)

	const handleSwipe = useCallback(
		(direction: string) => {
			if (direction === 'Swiped Left') {
				// Skip to previous song
				usePrevious()
			} else if (direction === 'Swiped Right') {
				// Skip to next song
				useSkip()
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
												uri:
													getImageApi(api)?.getItemImageUrlById(
														nowPlaying!.item.AlbumId! ||
															nowPlaying!.item.Id!,
														ImageType.Primary,
														{
															tag: nowPlaying!.item.ImageTags
																?.Primary,
														},
													) || '',
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
										<YStack
											justifyContent='center'
											marginRight={'$2'}
											paddingRight={'auto'}
										>
											<RunTimeSeconds alignment='left'>
												{Math.max(0, Math.floor(progress?.position ?? 0))}
											</RunTimeSeconds>
										</YStack>

										<Text color={'$neutral'} textAlign='center'>
											/
										</Text>

										<YStack justifyContent='center' marginLeft={'$2'}>
											<RunTimeSeconds color={'$neutral'} alignment='right'>
												{Math.max(0, Math.floor(progress?.duration ?? 0))}
											</RunTimeSeconds>
										</YStack>
									</XStack>

									{useMemo(
										() => (
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
										),
										[nowPlaying],
									)}
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
