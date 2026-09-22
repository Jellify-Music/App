import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { queryClient } from '../../constants/query-client'
import UserDataQueryKey from '../../api/queries/user-data/keys'
import fetchUserData from '../../api/queries/user-data/utils'
import { setQueryUserDataForItem } from '../../api/queries/user-data'
import { invalidateRelevantQueries } from '../../api/mutations/favorite'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { getApi, getUser } from '../../stores/auth/utils'
import { captureError, LoggingContext } from '../../utils/logging'
import { onCustomAction, setFavoriteButton } from './bridge'

/** Must match AndroidAutoBrowseModule.FAVORITE_ACTION. */
const FAVORITE_ACTION = 'com.jellify.FAVORITE'

let current: { track: TrackItem; item: BaseItemDto; isFavorite: boolean } | undefined

/** The native Favourites playlist of the last publish, kept in step with the heart. */
let favoritesPlaylistId: string | null = null

/** Called by each publish with the Favourites playlist it built (null when there are none). */
export function setFavoritesPlaylist(playlistId: string | null): void {
	favoritesPlaylistId = playlistId
}

/**
 * Adds or removes the track in the Favourites playlist, so Home and Playlists show it at once.
 * With no Favourites playlist yet, `republish` builds one. The playing queue isn't edited
 * under the listener's feet; the next publish catches up.
 */
async function updateFavoritesPlaylist(
	track: TrackItem,
	isFavorite: boolean,
	republish: () => void,
): Promise<void> {
	if (!favoritesPlaylistId) {
		if (isFavorite) republish()
		return
	}
	if (PlayerQueue.getCurrentPlaylistId() === favoritesPlaylistId) return

	if (isFavorite) {
		// A stream URL expires; leave it empty so it resolves on play. Local files keep theirs.
		const url = track.url.startsWith('file://') ? track.url : ''
		await PlayerQueue.addTrackToPlaylist(favoritesPlaylistId, { ...track, url })
	} else {
		await PlayerQueue.removeTrackFromPlaylist(favoritesPlaylistId, track.id)
	}
}

/** The track's favourite flag: the phone's cached user data, else the server's. */
async function isFavorite(item: BaseItemDto): Promise<boolean> {
	const user = getUser()!
	const cached = queryClient.getQueryData<UserItemDataDto>(UserDataQueryKey(user, item.Id!))
	if (cached) return !!cached.IsFavorite
	if (item.UserData) return !!item.UserData.IsFavorite
	return !!(await fetchUserData(item.Id!))?.IsFavorite
}

async function showFor(track: TrackItem | undefined): Promise<void> {
	const item = getTrackDto(track)
	if (!item?.Id || !getUser()) {
		current = undefined
		setFavoriteButton(null)
		return
	}

	const entry = { track: track!, item, isFavorite: false }
	current = entry
	try {
		entry.isFavorite = await isFavorite(item)
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, 'Failed to load favourite state')
	}
	if (current === entry) setFavoriteButton(entry.isFavorite)
}

/** Flips the playing track's favourite; the heart changes at once and reverts on failure. */
async function toggle(republish: () => void): Promise<void> {
	const entry = current
	const api = getApi()
	if (!entry || !api) return

	const next = !entry.isFavorite
	entry.isFavorite = next
	setFavoriteButton(next)
	try {
		const library = getUserLibraryApi(api)
		const { data } = next
			? await library.markFavoriteItem({ itemId: entry.item.Id! })
			: await library.unmarkFavoriteItem({ itemId: entry.item.Id! })
		setQueryUserDataForItem(entry.item, data)
		invalidateRelevantQueries(entry.item)
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, 'Failed to toggle favourite')
		entry.isFavorite = !next
		if (current === entry) setFavoriteButton(!next)
		return
	}

	try {
		await updateFavoritesPlaylist(entry.track, next, republish)
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, 'Failed to update the Favourites playlist')
	}
}

/**
 * A heart next to the transport controls (Android Auto's playback screen, the media
 * notification): filled when the playing track is a Jellyfin favourite, a press toggles it.
 */
export function registerFavoriteButton(republish: () => void): void {
	onCustomAction((action) => {
		if (action === FAVORITE_ACTION) void toggle(republish)
	})
	TrackPlayer.onChangeTrack((track) => void showFor(track))
}
