import React from 'react'
import {
	getToken,
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
export function Miniplayer({
	navigation,
}: {
	navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>
}): React.JSX.Element {
	const theme = useTheme()
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()
	const { useSkip } = useQueueContext()
	// Get progress from the track player with the specified update interval
	const progress = useProgress(UPDATE_INTERVAL, false)

	const { width, height } = useWindowDimensions()

	return (
		<ZStack height={'$8'}>
			<BlurredBackground width={width} height={height} />

			{nowPlaying && (
				<>
					<YStack>
						<Progress
							size={'$1'}
							value={calculateProgressPercentage(progress)}
							backgroundColor={'$borderColor'}
						>
							<Progress.Indicator
								borderColor={'$primary'}
								backgroundColor={'$primary'}
							/>
						</Progress>

						<XStack
							alignItems='center'
							margin={0}
							padding={0}
							height={'$7'}
							onPress={() => navigation.navigate('Player')}
						>
							<YStack
								justify='center'
								alignItems='flex-start'
								minHeight={'$12'}
								marginLeft={'$2'}
							>
								<FastImage
									source={{
										uri: getImageApi(api!).getItemImageUrlById(
											nowPlaying!.item.AlbumId! || nowPlaying!.item.Id!,
										),
									}}
									style={{
										width: getToken('$12') + getToken('$4'),
										height: getToken('$12') + getToken('$4'),
										borderRadius: getToken('$2'),
										backgroundColor: '$borderColor',
										shadowRadius: getToken('$2'),
										shadowOffset: {
											width: 0,
											height: -getToken('$2'),
										},
									}}
								/>
							</YStack>

							<YStack alignContent='flex-start' marginLeft={'$2'} flex={6}>
								<XStack gap={'$1.5'}>
									<RunTimeSeconds alignment='left'>
										{Math.max(0, Math.floor(progress?.position ?? 0))}
									</RunTimeSeconds>

									<Text color={'$neutral'}>/</Text>

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
							>
								<PlayPauseButton />
							</XStack>
						</XStack>
					</YStack>
				</>
			)}
		
		</ZStack>
	)
}

function calculateProgressPercentage(progress: TrackPlayerProgress | undefined): number {
	return Math.round(
		((progress!.position * ProgressMultiplier) / (progress!.duration * ProgressMultiplier)) *
			100,
	)
}
