import React, { memo } from 'react'
import { useNowPlayingContext } from '../../../providers/Player'
import { getToken, useTheme, View, YStack, ZStack } from 'tamagui'
import { useColorScheme } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useThemeSettingContext } from '../../../providers/Settings'
import { getPrimaryBlurhashFromDto } from '../../../utils/blurhash'
import { Blurhash } from 'react-native-blurhash'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

function BlurredBackground({
	width,
	height,
}: {
	width: number
	height: number
}): React.JSX.Element {
	const nowPlaying = useNowPlayingContext()

	const themeSetting = useThemeSettingContext()

	const theme = useTheme()
	const colorScheme = useColorScheme()

	// Calculate dark mode
	const isDarkMode =
		themeSetting === 'dark' || (themeSetting === 'system' && colorScheme === 'dark')

	// Get blurhash safely
	const blurhash = nowPlaying?.item ? getPrimaryBlurhashFromDto(nowPlaying.item) : null

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
		<ZStack flex={1} width={width} height={height}>
			<Animated.View
				style={{ flex: 1, width: width, height: height }}
				entering={FadeIn}
				exiting={FadeOut}
				key={`${nowPlaying!.item.AlbumId}-blurred-background`}
			>
				{blurhash && <Blurhash blurhash={blurhash} style={blurhashStyle} />}
			</Animated.View>

			{isDarkMode ? (
				<YStack width={width} height={height} position='absolute' flex={1}>
					<LinearGradient colors={darkGradientColors} style={gradientStyle} />

					<LinearGradient colors={darkGradientColors2} style={gradientStyle2} />
				</YStack>
			) : (
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
			)}
		</ZStack>
	)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(BlurredBackground, (prevProps, nextProps) => {
	// Only re-render if dimensions change
	return prevProps.width === nextProps.width && prevProps.height === nextProps.height
})
