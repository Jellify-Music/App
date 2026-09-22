import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { TrackItem, TrackPlayer } from 'react-native-nitro-player'
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

let current: { item: BaseItemDto; isFavorite: boolean } | undefined

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

	const entry = { item, isFavorite: false }
	current = entry
	try {
		entry.isFavorite = await isFavorite(item)
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, 'Failed to load favourite state')
	}
	if (current === entry) setFavoriteButton(entry.isFavorite)
}

/** Flips the playing track's favourite; the heart changes at once and reverts on failure. */
async function toggle(): Promise<void> {
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
	}
}

/**
 * A heart next to the transport controls (Android Auto's playback screen, the media
 * notification): filled when the playing track is a Jellyfin favourite, a press toggles it.
 */
export function registerFavoriteButton(): void {
	onCustomAction((action) => {
		if (action === FAVORITE_ACTION) void toggle()
	})
	TrackPlayer.onChangeTrack((track) => void showFor(track))
}
