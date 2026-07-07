import React from 'react'
import { useTheme, View, YStack, ZStack } from 'tamagui'
import { useWindowDimensions } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { Blurhash } from 'react-native-blurhash'
import useIsLightMode from '../../../hooks/use-is-light-mode'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { getBlurhashFromDto } from '../../../utils/parsing/blurhash'
import { useCurrentTrack } from '../../../stores/player/queue'

export default function BlurredBackground(): React.JSX.Element {
	const currentTrack = useCurrentTrack()
	const item = currentTrack && getTrackDto(currentTrack)

	const { width, height } = useWindowDimensions()

	const theme = useTheme()

	// Get blurhash safely
	const blurhash = item && getBlurhashFromDto(item)

	const isLightMode = useIsLightMode()

	// Define styles
	const blurhashStyle = {
		width: width,
		height: height,
	}

	return (
		<ZStack fullscreen>
			{blurhash && <Blurhash blurhash={blurhash} style={blurhashStyle} />}

			{isLightMode && (
				<View
					inset={0}
					position='absolute'
					backgroundColor={theme.background.val}
					width={width}
					height={height}
					opacity={0.75}
				/>
			)}
		</ZStack>
	)
}

export function BlurOverlay(): React.JSX.Element | null {
	const theme = useTheme()

	const isLightMode = useIsLightMode()

	const { width, height } = useWindowDimensions()

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
	// Use theme colors so the gradient follows the active color preset
	const darkGradientColors = [theme.black.val, theme.black75.val, theme.black25.val]
	const darkGradientColors2 = [
		theme.black25.val,
		theme.black75.val,
		theme.black.val,
		theme.black.val,
	]
	return !isLightMode ? (
		<YStack fullscreen>
			<LinearGradient colors={darkGradientColors} style={gradientStyle} />

			<LinearGradient colors={darkGradientColors2} style={gradientStyle2} />
		</YStack>
	) : null
}
