import { CommonActions, StackActions, TabActions } from '@react-navigation/native'
import navigationRef from '../../../../navigation'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { InteractionManager } from 'react-native'

export function goToAlbumFromContextSheet(album: BaseItemDto | undefined) {
	if (!navigationRef.isReady() || !album) return

	// Pop Context Sheet
	navigationRef.dispatch(StackActions.pop())

	let route = navigationRef.current?.getCurrentRoute()

	// If we've popped into the player, pop that as well
	if (route?.name.includes('Player')) {
		navigationRef.dispatch(StackActions.pop())

		route = navigationRef.current?.getCurrentRoute()
	}

	if (route?.name.includes('Settings')) {
		navigationRef.dispatch(TabActions.jumpTo('LibraryTab'))
		requestAnimationFrame(() => {
			navigationRef.dispatch(CommonActions.navigate('Album', { album }))
		})
	} else navigationRef.dispatch(CommonActions.navigate('Album', { album }))
}

export function goToArtistFromContextSheet(artist: BaseItemDto | undefined) {
	if (!navigationRef.isReady() || !artist) return

	// Pop Context Sheet
	navigationRef.dispatch(StackActions.pop())

	let route = navigationRef.current?.getCurrentRoute()

	// If we've popped into the player, pop that as well
	if (route?.name.includes('Player')) {
		navigationRef.dispatch(StackActions.pop())

		route = navigationRef.current?.getCurrentRoute()
	}

	if (route?.name.includes('Settings')) {
		navigationRef.dispatch(TabActions.jumpTo('LibraryTab'))
		requestAnimationFrame(() => {
			navigationRef.dispatch(CommonActions.navigate('Artist', { artist }))
		})
	} else navigationRef.dispatch(CommonActions.navigate('Artist', { artist }))
}
