import React, { useMemo } from 'react'
import Miniplayer from '../../components/Player/mini-player'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import useIsMiniPlayerActive from '../../hooks/use-mini-player'
import { useTheme } from 'tamagui'

/**
 * Merge theme-driven tab bar options into the focused route's descriptor
 * so the bar updates immediately when color preset changes (the navigator
 * often does not re-pass updated screenOptions to the tab bar).
 */
export default function TabBar(props: BottomTabBarProps): React.JSX.Element {
	const isMiniPlayerActive = useIsMiniPlayerActive()
	const theme = useTheme()

	const descriptorsWithTheme = useMemo(() => {
		const focusedRoute = props.state.routes[props.state.index]
		const focusedDescriptor = props.descriptors[focusedRoute.key]
		if (!focusedDescriptor) return props.descriptors
		return {
			...props.descriptors,
			[focusedRoute.key]: {
				...focusedDescriptor,
				options: {
					...focusedDescriptor.options,
					tabBarStyle: {
						...focusedDescriptor.options.tabBarStyle,
						backgroundColor: theme.background.val,
					},
					tabBarActiveTintColor: theme.primary.val,
					tabBarInactiveTintColor: theme.borderColor.val,
				},
			},
		}
	}, [
		props.descriptors,
		props.state.routes,
		props.state.index,
		theme.background.val,
		theme.primary.val,
		theme.borderColor.val,
	])

	// Key forces mini-player to remount when theme changes so colors update
	// (avoids stale styles from Reanimated/Progress when preset changes without interaction)
	const themeKey = `${theme.background.val}-${theme.primary.val}`

	// Filter out routes that explicitly request to be hidden from the tab bar.
	const visibleRoutes = props.state.routes.filter((route) => {
		const desc = descriptorsWithTheme[route.key]
		return desc?.options?.tabBarVisible !== false
	})

	// Map descriptors for visible routes only
	const visibleDescriptors = visibleRoutes.reduce<typeof descriptorsWithTheme>((acc, r) => {
		if (descriptorsWithTheme[r.key]) acc[r.key] = descriptorsWithTheme[r.key]
		return acc
	}, {})

	// Compute new index matching the focused route within the filtered list
	const focusedKey = props.state.routes[props.state.index]?.key
	let newIndex = visibleRoutes.findIndex((r) => r.key === focusedKey)
	if (newIndex === -1) newIndex = 0

	const filteredState = {
		...props.state,
		routes: visibleRoutes,
		index: newIndex,
	} as BottomTabBarProps['state']

	return (
		<>
			<Miniplayer key={themeKey} />
			<InternetConnectionWatcher />

			<BottomTabBar {...props} state={filteredState} descriptors={visibleDescriptors} />
		</>
	)
}
