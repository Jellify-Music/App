import React from 'react'
import { getToken, useTheme, View, YStack, ZStack } from 'tamagui'
import { useWindowDimensions } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { getBlurhashFromDto } from '../../../utils/parsing/blurhash'
import { Blurhash } from 'react-native-blurhash'
import { useCurrentTrack } from '../../../stores/player/queue'
import useIsLightMode from '../../../hooks/use-is-light-mode'

export default function BlurredBackground(): React.JSX.Element {
	const nowPlaying = useCurrentTrack()

	const { width, height } = useWindowDimensions()

	const theme = useTheme()
	const isLightMode = useIsLightMode()

	// Get blurhash safely
	const blurhash = nowPlaying?.item ? getBlurhashFromDto(nowPlaying.item) : null

	// Define gradient colors
	const darkGradientColors = [getToken('$black'), getToken('$black25')]
	const darkGradientColors2 = [
		getToken('$black25'),
		getToken('$black75'),
		getToken('$black'),
		getToken('$black'),
	]

	// Define styles
	const blurhashStyle = {
		flex: 1,
		width: width,
		height: height,
	}

	const gradientStyle = {
		width,
		height,
		flex: 1,
	}

	const gradientStyle2 = {
		width,
		height,
		flex: 3,
	}

	const backgroundStyle = {
		flex: 1,
		position: 'absolute' as const,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: theme.background.val,
		width: width,
		height: height,
		opacity: 0.5,
	}

	return (
		<ZStack flex={1}>
			{blurhash && <Blurhash blurhash={blurhash} style={blurhashStyle} />}

			{isLightMode ? (
				<View
					flex={1}
					position='absolute'
					top={0}
					left={0}
					right={0}
					bottom={0}
					backgroundColor={theme.background.val}
					width={width}
					height={height}
					opacity={0.5}
					style={backgroundStyle}
				/>
			) : (
				<YStack flex={1}>
					<LinearGradient colors={darkGradientColors} style={gradientStyle} />

					<LinearGradient colors={darkGradientColors2} style={gradientStyle2} />
				</YStack>
			)}
		</ZStack>
	)
}
