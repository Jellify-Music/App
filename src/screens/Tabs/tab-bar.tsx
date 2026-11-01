import React from 'react'
import Miniplayer from '../../components/Miniplayer'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs'
import useIsMiniPlayerActive from '../../hooks/use-mini-player'
import { useTheme } from 'tamagui'
import HolidayTabBar from '../../components/Holidays/tab-bar'
import { useIsHolidays } from '../../components/Holidays/hooks'

/**
 * Merge theme-driven tab bar options into the focused route's descriptor
 * so the bar updates immediately when color preset changes (the navigator
 * often does not re-pass updated screenOptions to the tab bar).
 */
export default function TabBar(props: BottomTabBarProps): React.JSX.Element {
	const isMiniPlayerActive = useIsMiniPlayerActive()
	const isHolidays = useIsHolidays()
	const theme = useTheme()

	const descriptorsWithTheme = (() => {
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
					// `neutral` equals `borderColor` in every preset except Holidays, where the
					// design wants a dimmer inactive tab than the muted text color
					tabBarInactiveTintColor: theme.neutral.val,
				},
			},
		}
	})()

	// Key forces mini-player to remount when theme changes so colors update
	// (avoids stale styles from Reanimated/Progress when preset changes without interaction)
	const themeKey = `${theme.background.val}-${theme.primary.val}`

	return (
		<>
			{isMiniPlayerActive && <Miniplayer key={themeKey} />}
			<InternetConnectionWatcher />

			{isHolidays ? (
				<HolidayTabBar {...props} />
			) : (
				<BottomTabBar {...props} descriptors={descriptorsWithTheme} />
			)}
		</>
	)
}
