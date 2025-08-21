import { useNowPlayingContext } from '../../providers/Player'
import React, { useCallback, useMemo, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
	YStack,
	XStack,
	getToken,
	useTheme,
	ZStack,
	useWindowDimensions,
	View,
	getTokenValue,
} from 'tamagui'
import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from '../../constants/toast.config'
import { useFocusEffect } from '@react-navigation/native'
import Footer from './components/footer'
import BlurredBackground from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '../../screens/Player/types'
import { Platform } from 'react-native'

export default function PlayerScreen({
	navigation,
}: {
	navigation: NativeStackNavigationProp<PlayerParamList>
}): React.JSX.Element {
	const performanceMetrics = usePerformanceMonitor('PlayerScreen', 5)

	const [showToast, setShowToast] = useState(true)

	const nowPlaying = useNowPlayingContext()

	const theme = useTheme()

	useFocusEffect(
		useCallback(() => {
			setShowToast(true)

			return () => setShowToast(false)
		}, []),
	)

	const isAndroid = Platform.OS === 'android'

	const { width, height } = useWindowDimensions()

	const { top, bottom } = useSafeAreaInsets()

	/**
	 * Styling for the top layer of Player ZStack
	 *
	 * Android Modals extend into the safe area, so we
	 * need to account for that
	 *
	 * Apple devices get a small amount of margin
	 */
	const mainContainerStyle = useMemo(
		() => ({
			marginTop: isAndroid ? top : getTokenValue('$4'),
			marginBottom: bottom * 2,
		}),
		[top, bottom, isAndroid],
	)

	return (
		<View flex={1}>
			{nowPlaying && (
				<ZStack fullscreen>
					<BlurredBackground width={width} height={height} />

					<YStack
						justifyContent='center'
						flex={1}
						marginHorizontal={'$5'}
						{...mainContainerStyle}
					>
						{/* flexGrow 1 */}
						<PlayerHeader />

						<YStack justifyContent='flex-start' gap={'$4'} flexShrink={1}>
							<SongInfo navigation={navigation} />

							<Scrubber />
							{/* playback progress goes here */}
							<Controls />
							<Footer />
						</YStack>
					</YStack>
				</ZStack>
			)}
			{showToast && <Toast config={JellifyToastConfig(theme)} />}
		</View>
	)
}
