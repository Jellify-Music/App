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

export default function PlayerScreen({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const [showToast, setShowToast] = useState(true)

	const { nowPlaying } = usePlayerContext()

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
							flexShrink={1}
							flexGrow={0.5}
						>
							<SongInfo navigation={navigation} />
						</XStack>

						<XStack
							justifyContent='center'
							flexShrink={1}
							flexGrow={0.5}
							marginTop={'$2'}
						>
							{/* playback progress goes here */}
							<Scrubber />
						</XStack>

						<Controls />

						<Footer navigation={navigation} />
					</YStack>
				</ZStack>
			)}
			{showToast && <Toast config={JellifyToastConfig(theme)} />}
		</View>
	)
}
