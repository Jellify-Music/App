import { CommonActions, StackActions, TabActions } from '@react-navigation/native'
import navigationRef from '../../../../navigation'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export function goToAlbumFromContextSheet(album: BaseItemDto | undefined) {
	if (!navigationRef.isReady() || !album) return

	// Pop Context Sheet
	navigationRef.dispatch(StackActions.pop())

	const state = navigationRef.getRootState()
	const tabsRoute = state.routes.find((r) => r.name === 'Tabs')

	if (tabsRoute && tabsRoute.state && typeof tabsRoute.state.index === 'number') {
		const tabsState = tabsRoute.state
		const activeTabIndex = tabsState.index
		const activeTabName = tabsState.routes[activeTabIndex!]?.name

		// If we are in Settings, we want to jump to Library
		if (activeTabName === 'SettingsTab') {
			navigationRef.dispatch(TabActions.jumpTo('LibraryTab'))
			// We need to wait for the tab switch to happen before navigating
			// Using requestAnimationFrame as a simple heuristic, though interaction manager might be better
			requestAnimationFrame(() => {
				navigationRef.dispatch(CommonActions.navigate('Album', { album }))
			})
		} else {
			// For Home, Library, Search, Discover - they all have 'Album' in their stack
			navigationRef.dispatch(CommonActions.navigate('Album', { album }))
		}
	} else {
		// Fallback if we can't find Tabs state (unlikely if logged in)
		navigationRef.dispatch(CommonActions.navigate('Album', { album }))
	}
}

export function goToArtistFromContextSheet(artist: BaseItemDto | undefined) {
	if (!navigationRef.isReady() || !artist) return

	// Pop Context Sheet
	navigationRef.dispatch(StackActions.pop())

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
				navigationRef.dispatch(CommonActions.navigate('Artist', { artist }))
			})
		} else {
			// For Home, Library, Search, Discover - they all have 'Artist' in their stack
			navigationRef.dispatch(CommonActions.navigate('Artist', { artist }))
		}
	} else {
		navigationRef.dispatch(CommonActions.navigate('Artist', { artist }))
	}
}
