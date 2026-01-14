import React, { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Spinner, useWindowDimensions, YStack } from 'tamagui'
import { useSharedValue } from 'react-native-reanimated'

import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useCurrentTrack } from '../../stores/player/queue'
import { usePlayerTheme } from '../../stores/settings/player-theme'
import { themeRegistry } from './themes'
import type { PlayerThemeComponent, PlayerThemeProps } from './themes/types'

// Default theme is bundled for instant display
import DefaultTheme from './themes/default'

export default function PlayerScreen(): React.JSX.Element {
	usePerformanceMonitor('PlayerScreen', 5)

	const nowPlaying = useCurrentTrack()
	const [playerThemeId] = usePlayerTheme()
	const [ThemeComponent, setThemeComponent] = useState<PlayerThemeComponent>(DefaultTheme)
	const [isLoading, setIsLoading] = useState(playerThemeId !== 'default')

	const { width, height } = useWindowDimensions()
	const insets = useSafeAreaInsets()
	const swipeX = useSharedValue(0)

	// Load selected theme
	useEffect(() => {
		if (playerThemeId === 'default') {
			setThemeComponent(DefaultTheme)
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		themeRegistry
			.getTheme(playerThemeId)
			.then(setThemeComponent)
			.catch((error) => {
				console.error('Failed to load theme:', error)
				setThemeComponent(DefaultTheme) // Fallback
			})
			.finally(() => setIsLoading(false))
	}, [playerThemeId])

	if (!nowPlaying) return <></>

	if (isLoading) {
		return (
			<YStack
				flex={1}
				justifyContent='center'
				alignItems='center'
				backgroundColor='$background'
			>
				<Spinner size='large' color='$primary' />
			</YStack>
		)
	}

	const themeProps: PlayerThemeProps = {
		nowPlaying,
		swipeX,
		dimensions: { width, height },
		insets: {
			top: insets.top,
			bottom: insets.bottom,
			left: insets.left,
			right: insets.right,
		},
	}

	return <ThemeComponent.Player {...themeProps} />
}
