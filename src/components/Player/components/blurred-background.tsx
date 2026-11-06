import React from 'react'
import { useTheme, View, ZStack } from 'tamagui'
import { StyleSheet } from 'react-native'
import { useWindowDimensions } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { Blurhash } from 'react-native-blurhash'
import useIsLightMode from '../../../hooks/use-is-light-mode'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { getBlurhashFromDto } from '../../../utils/parsing/blurhash'
import { useCurrentTrack } from '../../../stores/player/queue'
import { usePlayerContext } from '../../../providers/Player'

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
		<ZStack position='absolute' inset={0}>
			{blurhash && <Blurhash blurhash={blurhash} style={blurhashStyle} decodeAsync />}

			{isLightMode && (
				<View
					inset={0}
					position='absolute'
					backgroundColor={theme.background.val}
					width={width}
					height={height}
					opacity={0.5}
				/>
			)}
		</ZStack>
	)
}

export function BlurOverlay(): React.JSX.Element | null {
	const theme = useTheme()

	const isLightMode = useIsLightMode()

	const { displayLyrics } = usePlayerContext()

	// Use theme colors so the gradient follows the active color preset
	const darkGradientColors2 = [
		theme.black.val,
		theme.black75.val,
		!displayLyrics ? theme.black50.val : theme.black75.val,
		!displayLyrics ? 'transparent' : theme.black75.val,
		!displayLyrics ? theme.black50.val : theme.black75.val,
		theme.black75.val,
		theme.black.val,
		theme.black.val,
		theme.black.val,
		theme.black.val,
	]
	return !isLightMode ? (
		<LinearGradient colors={darkGradientColors2} style={styles.gradient} />
	) : null
}

const styles = StyleSheet.create({
	gradient: {
		flex: 1,
		...StyleSheet.absoluteFill,
	},
})
