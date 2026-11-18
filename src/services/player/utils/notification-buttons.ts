import { NotificationButtonEvent, NotificationButtons, TrackItem } from 'react-native-nitro-player'
import { FAVORITE_BUTTON_ID } from './favorite-button-state'
import { onFavoriteButtonPress } from './favorite-button'
import { onShuffleButtonPress, SHUFFLE_BUTTON_ID } from './shuffle-button'

/**
 * Extra buttons in the system media controls: Control Center and the
 * Lock Screen and CarPlay on iOS, the media notification and Android Auto on Android
 */
export const notificationButtons: NotificationButtons = {
	android: [
		{
			id: FAVORITE_BUTTON_ID,
			title: 'Favorite',
			icon: 'heart',
			activeIcon: 'heart_filled',
		},
	],
	ios: {
		lockScreen: [{ id: FAVORITE_BUTTON_ID, title: 'Favorite', command: 'like' }],
		carPlay: [
			{ id: SHUFFLE_BUTTON_ID, type: 'shuffle' },
			{ id: FAVORITE_BUTTON_ID, icon: 'heart', activeIcon: 'heart.fill' },
		],
	},
}

/**
 * An event handler for the {@link TrackPlayer.onNotificationButtonPress} event.
 */
export function onNotificationButtonPress(
	buttonId: string,
	track: TrackItem,
	event: NotificationButtonEvent,
) {
	switch (buttonId) {
		case FAVORITE_BUTTON_ID:
			return onFavoriteButtonPress(track, event)
		case SHUFFLE_BUTTON_ID:
			return onShuffleButtonPress(event)
	}
}
