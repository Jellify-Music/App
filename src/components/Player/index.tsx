import { StackParamList } from '../types'
import { usePlayerContext } from '../../providers/Player'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, XStack, getToken, useTheme, ZStack, useWindowDimensions, View } from 'tamagui'
import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from '../../constants/toast.config'
import { useFocusEffect } from '@react-navigation/native'
import Footer from './components/footer'
import BlurredBackground from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'
import { useQuery } from '@tanstack/react-query'
import { fetchRawLyrics, parseLrc } from '../../api/queries/lyrics'
import { useJellifyContext } from '../../providers'
import LyricsCard from './components/lyrics-card'
import { useProgress } from 'react-native-track-player'

export default function PlayerScreen({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const [showToast, setShowToast] = useState(true)
	const [showLyrics, setShowLyrics] = useState(false)

	const { nowPlaying } = usePlayerContext()
	const { api } = useJellifyContext()
	const progress = useProgress(500)

	const { data: rawLyrics } = useQuery({
		queryKey: ['lyrics', nowPlaying?.item.Id],
		queryFn: () => fetchRawLyrics(api, nowPlaying!.item.Id!),
		enabled: !!nowPlaying?.item.Id && showLyrics,
	})

	const parsedLyrics = parseLrc(rawLyrics)

	const theme = useTheme()

	useFocusEffect(
		useCallback(() => {
			setShowToast(true)

			return () => setShowToast(false)
		}, []),
	)

	const { width, height } = useWindowDimensions()

	const { bottom } = useSafeAreaInsets()

	return (
		<View flex={1} marginBottom={bottom}>
			{nowPlaying && (
				<ZStack fullscreen>
					<BlurredBackground width={width} height={height} />

					<YStack flex={1}>
						<PlayerHeader navigation={navigation} />

						<XStack
							justifyContent='center'
							alignItems='center'
							marginHorizontal={'auto'}
							width={getToken('$20') + getToken('$20') + getToken('$5')}
							maxWidth={width / 1.1}
							flex={2}
						>
							{/* Wrap SongInfo & Lyrics overlay in a ZStack style container */}
							<LyricsCard
								show={showLyrics}
								lines={parsedLyrics}
								progressSeconds={progress.position}
							>
								<SongInfo navigation={navigation} />
							</LyricsCard>
						</XStack>

						<XStack justifyContent='center' flex={1}>
							{/* playback progress goes here */}
							<Scrubber />
						</XStack>

						<Controls />

						<Footer
							navigation={navigation}
							showLyrics={showLyrics}
							onToggleLyrics={() => setShowLyrics((s) => !s)}
						/>
					</YStack>
				</ZStack>
			)}
			{showToast && <Toast config={JellifyToastConfig(theme)} />}
		</View>
	)
}
