import { NotificationButtonEvent, TrackItem } from 'react-native-nitro-player'
import { queryClient } from '../../../api/client'
import { QueryAges } from '../../../constants/durations'
import { setFavorite } from '../../../api/mutations/favorite'
import UserDataQueryKey from '../../../api/queries/user-data/keys'
import fetchUserData from '../../../api/queries/user-data/utils'
import { getUser } from '../../../stores/auth/utils'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { captureError } from '../../../utils/logging'
import LoggingContext from '../../../utils/logging/enums'
import { setFavoriteButtonState } from './favorite-button-state'

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
 * Favorites or unfavorites the track from the media controls.
 *
 * The button has already switched state by the time this is called, so it is
 * switched back if Jellyfin doesn't accept the change.
 */
export async function onFavoriteButtonPress(
	track: TrackItem,
	{ isActive }: NotificationButtonEvent,
) {
	if (isActive === undefined) return

	try {
		await setFavorite(getTrackDto(track)!, isActive)
	} catch (error) {
		setFavoriteButtonState(track.id, !isActive)

		captureError(error, LoggingContext.Favorites, 'Failed to favorite from media controls')
	}
}
