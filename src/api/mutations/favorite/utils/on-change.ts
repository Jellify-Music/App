import { queryClient } from '../../../client'
import { MusicLibraryQueryKey } from '../../../queries/libraries/keys'
import { TrackQueryKeys } from '../../../queries/track/keys'
import { setQueryUserDataForItem } from '../../../queries/user-data/cache'
import { QueryKeys } from '../../../../enums/query-keys'
import { setFavoriteButtonState } from '../../../../services/player/utils/favorite-button-state'
import { getLibrary } from '../../../../stores/auth/utils'
import { BaseItemDto, UserItemDataDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'

/**
 * Updates the cache and the media controls' favorite button after an item's favorite status changes
 *
 * @param item The item whose favorite status has changed
 * @param userData The updated user data for the item
 */
export function onFavoriteChanged(item: BaseItemDto, userData: UserItemDataDto | undefined): void {
	setQueryUserDataForItem(item, userData)

	// Optimized: Only invalidate the relevant query based on item type and filter state
	invalidateRelevantQueries(item)

	if (item.Type === BaseItemKind.Audio && item.Id && userData)
		setFavoriteButtonState(item.Id, userData.IsFavorite ?? false)
}

/**
 * Optimized query invalidation that only invalidates:
 * 1. The query for the specific item type (Tracks, Albums, or Artists)
 * 2. Only favorites-filtered queries when isFavorites === true
 * This prevents unnecessary refetches of large lists when filters aren't active.
 */
function invalidateRelevantQueries(item: BaseItemDto): void {
	// Only invalidate if favorites filter is active, or always invalidate favorites-filtered queries
	// (so they're fresh when user turns on filter later)
	const libraryId = MusicLibraryQueryKey(getLibrary()?.musicLibraryId)

	// Determine which query to invalidate based on item type
	// Always invalidate favorites-filtered queries so they're fresh when filter is turned on
	if (item.Type === BaseItemKind.Audio) {
		// For tracks: always invalidate favorites-filtered query
		queryClient.invalidateQueries({
			predicate: (query) => {
				const key = query.queryKey
				if (key[0] !== TrackQueryKeys.AllTracks) return false
				if (key[1] !== libraryId) return false
				// Always invalidate favorites-filtered queries (so they're fresh when filter is turned on)
				if (key[2] === 'favorites:true') return true
				return false
			},
		})
	} else if (item.Type === BaseItemKind.MusicAlbum) {
		// For albums: always invalidate favorites-filtered query
		queryClient.invalidateQueries({
			predicate: (query) => {
				const key = query.queryKey
				if (key[0] !== QueryKeys.InfiniteAlbums) return false
				if (key[2] !== libraryId) return false
				// Always invalidate favorites-filtered queries
				if (key[1] === true) return true
				return false
			},
		})
	} else if (item.Type === BaseItemKind.MusicArtist) {
		// For artists: always invalidate favorites-filtered query
		queryClient.invalidateQueries({
			predicate: (query) => {
				const key = query.queryKey
				if (key[0] !== QueryKeys.InfiniteArtists) return false
				if (key[3] !== libraryId) return false
				// Always invalidate favorites-filtered queries
				if (key[1] === true) return true
				return false
			},
		})
	}
}
