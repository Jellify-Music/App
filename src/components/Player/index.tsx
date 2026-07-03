import React from 'react'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, ZStack, View, useWindowDimensions, Paragraph } from 'tamagui'
import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Footer from './components/footer'
import BlurredBackground from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { GestureDetector } from 'react-native-gesture-handler'
import { useCurrentTrack } from '../../stores/player/queue'
import { TrackItem } from 'react-native-nitro-player'
import { useAlbumCoverGestures } from '../../hooks/gestures/player'

export default function PlayerScreen(): React.JSX.Element {
	usePerformanceMonitor('PlayerScreen', 5)

	const nowPlaying = useCurrentTrack()

	return nowPlaying ? <PlayerScreenInner nowPlaying={nowPlaying} /> : <></>
}

interface PlayerScreenInnerProps {
	nowPlaying: TrackItem
}

function PlayerScreenInner({ nowPlaying }: PlayerScreenInnerProps) {
	const { width, height } = useWindowDimensions()

	const albumCoverGestures = useAlbumCoverGestures()

	return (
		<ZStack position='absolute' height={height} width={width}>
			<BlurredBackground />

			{/* Central large swipe area overlay (captures swipe like big album art) */}
			<GestureDetector gesture={albumCoverGestures}>
				<View
					style={{
						position: 'absolute',
						top: height * 0.18,
						left: width * 0.06,
						right: width * 0.06,
						height: height * 0.36,
						zIndex: 9998,
					}}
				/>
			</GestureDetector>

			<PlayerScreenInterface />
		</ZStack>
	)
}

function PlayerScreenInterface() {
	const { bottom } = useSafeAreaInsets()

	return (
		<YStack
			position='absolute'
			inset={'$4'}
			marginBottom={bottom}
			justifyContent='center'
			zIndex={4}
		>
			{/* flexGrow 1 */}
			<PlayerHeader />

			<YStack justifyContent='flex-start' gap={'$4'} flexShrink={1}>
				<SongInfo />
				<Scrubber />
				<Controls />
				<Footer />
			</YStack>
		</YStack>
	)
}
