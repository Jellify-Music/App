import { TrackPlayer } from 'react-native-nitro-player'

export const FAVORITE_BUTTON_ID = 'favorite'

/**
 * Shows whether a track is a favorite in the media controls.
 *
 * Kept apart from the button's press handler so the favorite mutations
 * can update the button without importing the player service.
 */
export function setFavoriteButtonState(trackId: string, isFavorite: boolean) {
	TrackPlayer.setNotificationButtonState({
		buttonId: FAVORITE_BUTTON_ID,
		trackIds: [trackId],
		isActive: isFavorite,
	})
}
