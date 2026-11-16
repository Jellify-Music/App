import {
	NotificationButtonEvent,
	NotificationButtons,
	TrackItem,
	TrackPlayer,
} from 'react-native-nitro-player'
import { queryClient } from '../../../api/client'
import { QueryAges } from '../../../constants/durations'
import { setFavorite } from '../../../api/mutations/favorite'
import UserDataQueryKey from '../../../api/queries/user-data/keys'
import fetchUserData from '../../../api/queries/user-data/utils'
import { getUser } from '../../../stores/auth/utils'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { captureError } from '../../../utils/logging'
import LoggingContext from '../../../utils/logging/enums'

const FAVORITE_BUTTON_ID = 'favorite'

/**
 * A favorite toggle in the system media controls: Control Center and the
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
		carPlay: [{ id: FAVORITE_BUTTON_ID, icon: 'heart', activeIcon: 'heart.fill' }],
	},
}

export function setFavoriteButtonState(trackId: string, isFavorite: boolean) {
	TrackPlayer.setNotificationButtonState({
		buttonId: FAVORITE_BUTTON_ID,
		trackIds: [trackId],
		isActive: isFavorite,
	})
}

/**
 * Shows whether the track is a favorite in the media controls.
 *
 * Queued tracks don't carry their user data, so this reads the cached
 * user data, fetching it when there is none or it has gone stale.
 */
export async function syncFavoriteButton(track: TrackItem) {
	const user = getUser()

	if (!user || !track.id) return

	try {
		const { IsFavorite } = await queryClient.query({
			queryKey: UserDataQueryKey(user, track.id),
			queryFn: ({ signal }) => fetchUserData(track.id, signal),
			staleTime: QueryAges.OneHour / 4,
		})

		setFavoriteButtonState(track.id, IsFavorite ?? false)
	} catch (error) {
		captureError(
			error,
			LoggingContext.Favorites,
			'Failed to sync media controls favorite button',
		)
	}
}

/**
 * An event handler for the {@link TrackPlayer.onNotificationButtonPress} event.
 *
 * The button has already switched state by the time this is called, so it is
 * switched back if Jellyfin doesn't accept the change.
 */
export async function onNotificationButtonPress(
	buttonId: string,
	track: TrackItem,
	{ isActive }: NotificationButtonEvent,
) {
	if (buttonId !== FAVORITE_BUTTON_ID || isActive === undefined) return

	try {
		await setFavorite(getTrackDto(track)!, isActive)
	} catch (error) {
		setFavoriteButtonState(track.id, !isActive)

		captureError(error, LoggingContext.Favorites, 'Failed to favorite from media controls')
	}
}
