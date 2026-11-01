import React, { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'tamagui'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import {
	DiscoverTabIcon,
	HomeTabIcon,
	LibraryTabIcon,
	SearchTabIcon,
	SettingsTabIcon,
} from './icons'
import { useHolidayTokens } from './hooks'

const TAB_ICONS: Record<string, React.ComponentType<{ color: string }>> = {
	HomeTab: HomeTabIcon,
	LibraryTab: LibraryTabIcon,
	SearchTab: SearchTabIcon,
	DiscoverTab: DiscoverTabIcon,
	SettingsTab: SettingsTabIcon,
}

const ITEM_HEIGHT = 56
/** The design's tab bar is 84px on a device with a 34px home indicator inset */
const HOME_INDICATOR_ALLOWANCE = 6

/**
 * The tab bar from the Holidays design: 56px items (28px icon, 12.5px label) under a
 * hairline, with the Home tab's jellyfish wearing a Santa hat.
 */
function HolidayTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()
	const { bottom } = useSafeAreaInsets()

	return (
		<View
			style={[
				styles.bar,
				{
					height: ITEM_HEIGHT + Math.max(bottom - HOME_INDICATOR_ALLOWANCE, 0),
					backgroundColor: theme.background.val,
					borderTopColor: tokens.hairline,
				},
			]}
		>
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key]
				const focused = state.index === index
				const color = focused ? theme.primary.val : theme.neutral.val
				const Icon = TAB_ICONS[route.name]
				const label = options.title ?? route.name

				const onPress = () => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
						canPreventDefault: true,
					})

					if (!focused && !event.defaultPrevented) {
						navigation.navigate(route.name, route.params)
					}
				}

				const onLongPress = () => {
					navigation.emit({ type: 'tabLongPress', target: route.key })
				}

				return (
					<Pressable
						key={route.key}
						accessibilityRole='button'
						accessibilityState={focused ? { selected: true } : {}}
						accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
						testID={options.tabBarButtonTestID}
						onPress={onPress}
						onLongPress={onLongPress}
						style={styles.item}
					>
						{Icon && <Icon color={color} />}
						<Text style={[styles.label, { color }]}>{label}</Text>
					</Pressable>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	bar: {
		flexDirection: 'row',
		borderTopWidth: 1,
	},
	item: {
		flex: 1,
		height: ITEM_HEIGHT,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 3,
	},
	label: {
		fontFamily: 'Figtree-Medium',
		fontSize: 12.5,
	},
})

export default memo(HolidayTabBar)
