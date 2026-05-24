import { CommonActions, RouteProp, StackActions, TabActions } from '@react-navigation/native'
import navigationRef from '../../../screens/navigation'
import { BaseStackParamList } from '@/src/screens/types'

export default function goToScreenFromContextSheet(
	screenName: keyof BaseStackParamList,
	params: Pick<
		RouteProp<BaseStackParamList, typeof screenName>['params'],
		keyof RouteProp<BaseStackParamList, typeof screenName>['params']
	>,
) {
	if (!navigationRef.isReady()) return

	// Pop Context Sheet
	navigationRef.dispatch(StackActions.pop())

	if (navigationRef.getCurrentRoute()?.name === 'PlayerScreen')
		navigationRef.dispatch(StackActions.pop()) // Dismiss player modal

	const state = navigationRef.getRootState()
	const tabsRoute = state.routes.find((r) => r.name === 'Tabs')

	if (tabsRoute && tabsRoute.state && typeof tabsRoute.state.index === 'number') {
		const tabsState = tabsRoute.state
		const activeTabIndex = tabsState.index
		const activeTabName = tabsState.routes[activeTabIndex!]?.name

		// If we are in Settings, we want to jump to Library
		if (activeTabName === 'SettingsTab') {
			navigationRef.dispatch(TabActions.jumpTo('LibraryTab'))
			requestAnimationFrame(() => {
				navigationRef.dispatch(CommonActions.navigate(screenName, params))
			})
		} else {
			// For Home, Library, Search, Discover - they all have the screen in their stack
			requestAnimationFrame(() => {
				navigationRef.dispatch(CommonActions.navigate(screenName, params))
			})
		}
	} else {
		requestAnimationFrame(() => {
			navigationRef.dispatch(CommonActions.navigate(screenName, params))
		})
	}
}
