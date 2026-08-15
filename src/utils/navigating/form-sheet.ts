import { Platform } from 'react-native'

export const canUseFormSheet =
	(Platform.OS === 'android' && Platform.Version >= 35) || Platform.OS === 'ios'

export const bottomSheetPresentation: 'formSheet' | 'modal' = canUseFormSheet
	? 'formSheet'
	: 'modal'

export const playerSheetPresentation: 'formSheet' | 'modal' =
	canUseFormSheet && Platform.OS !== 'ios' ? 'formSheet' : 'modal'

/**
 * The "Add to Playlist" sheet contains a list of playlists that
 * can be quite long, so we want to use the form sheet presentation
 * on Android to allow for better navigation, but on iOS the modal
 * presentation works better with the overall design and doesn't
 * cause any issues with navigation, so we use modal there.
 */
export const addToPlaylistSheetPresentation: 'formSheet' | 'modal' =
	canUseFormSheet && Platform.OS !== 'ios' ? 'formSheet' : 'modal'
