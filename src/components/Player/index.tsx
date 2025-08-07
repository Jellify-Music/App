import { StackParamList } from '../types'
import { usePlayerContext } from '../../providers/Player'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
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
import QueryConfig from '../../api/queries/query.config'

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

	const { data: rawLyrics = '', isFetching: lyricsLoading } = useQuery({
		queryKey: ['lyrics', nowPlaying?.item.Id],
		queryFn: async () => {
			const data = await fetchRawLyrics(api, nowPlaying!.item.Id!)
			return data ?? ''
		},
		enabled: !!nowPlaying?.item.Id,
		staleTime: QueryConfig.staleTime.oneDay,
		retry: false,
	})

	const parsedLyrics = parseLrc(rawLyrics)
	const hasLyrics = !lyricsLoading && parsedLyrics.length > 0

	// Ensure we never show lyrics if none exist
	useEffect(() => {
		if (showLyrics && !hasLyrics) setShowLyrics(false)
	}, [hasLyrics, showLyrics])

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
							lyricsAvailable={hasLyrics}
							onToggleLyrics={() => {
								if (!hasLyrics) return
								setShowLyrics((s) => !s)
							}}
						/>
					</YStack>
				</ZStack>
			)}
			{showToast && <Toast config={JellifyToastConfig(theme)} />}
		</View>
	)
}
