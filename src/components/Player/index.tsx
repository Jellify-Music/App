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
import HolidayPlayerBackground from '../Holidays/player-background'
import { useIsHolidays } from '../Holidays/hooks'

/**
 * The design's footer ends 12px above the screen bottom on a device with a 34px home indicator
 * inset, which the stock layout (inset + 18px stack margin) leaves 40px short
 */
const HOLIDAY_BOTTOM_SHIFT = 49

export default function PlayerScreen(): React.JSX.Element {
	const isHolidays = useIsHolidays()

	return (
		<ZStack position='absolute' inset={0}>
			{isHolidays ? <HolidayPlayerBackground /> : <BlurredBackground />}

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

	const isHolidays = useIsHolidays()

	const { bottom } = useSafeAreaInsets()

	return nowPlaying ? (
		<ZStack position='absolute' inset={0}>
			{!isHolidays && <BlurOverlay />}

			<YStack
				flex={1}
				justifyContent='center'
				marginTop='3'
				marginHorizontal='4'
				marginBottom={isHolidays ? Math.max(bottom - HOLIDAY_BOTTOM_SHIFT, 0) : bottom}
			>
				{/* flexGrow 1 */}
				<PlayerHeader />

				<YStack flexShrink={1} gap='4' justifyContent='flex-start' marginBottom='4'>
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
