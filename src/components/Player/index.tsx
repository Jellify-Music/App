import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack, ZStack, View } from 'tamagui'
import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Footer from './components/footer'
import BlurredBackground, { BlurOverlay } from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useCurrentTrack } from '../../stores/player/queue'
import Queue from '../Queue'
import { StyleSheet } from 'react-native'
import { PlayerProvider } from '../../providers/Player'

export default function PlayerScreen(): React.JSX.Element {
	return (
		<ZStack fullscreen>
			<BlurredBackground />

			<PlayerProvider>
				<View collapsable={false} style={styles.pagerView}>
					<Player />
				</View>

				<View collapsable={false} style={styles.pagerView}>
					<Queue />
				</View>
			</PlayerProvider>
		</ZStack>
	)
}

export function Player(): React.JSX.Element {
	usePerformanceMonitor('PlayerScreen', 5)

	const nowPlaying = useCurrentTrack()

	const { bottom } = useSafeAreaInsets()

	return nowPlaying ? (
		<ZStack fullscreen>
			<BlurOverlay />

			<YStack
				flex={1}
				justifyContent='center'
				marginTop={'$3'}
				marginHorizontal={'$4'}
				marginBottom={bottom}
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
		</ZStack>
	) : (
		<></>
	)
}

const styles = StyleSheet.create({
	pagerView: {
		height: '100%',
		width: '100%',
	},
})
