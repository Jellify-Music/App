import { Platform } from 'react-native'

export const canUseFormSheet =
	(Platform.OS === 'android' && Platform.Version >= 35) || Platform.OS === 'ios'

export const bottomSheetPresentation: 'formSheet' | 'modal' = canUseFormSheet
	? 'formSheet'
	: 'modal'

export const playerSheetPresentation: 'formSheet' | 'modal' =
	canUseFormSheet && Platform.OS !== 'ios' ? 'formSheet' : 'modal'

/**
 * Determines the presentation style for the "Add to Playlist" sheet.
 * Uses 'formSheet' if supported and not on iOS, otherwise falls back to 'modal'.
 *
 * IDK why iOS doesn't work with 'formSheet' here, but 'modal' works fine.
 *
 * @returns 'formSheet' if supported and not on iOS, otherwise 'modal'.
 */
export const addToPlaylistSheetPresentation: 'formSheet' | 'modal' =
	canUseFormSheet && Platform.OS !== 'ios' ? 'formSheet' : 'modal'
