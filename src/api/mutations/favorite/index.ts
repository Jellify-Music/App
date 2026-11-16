import { queryClient } from '../../client'
import { BaseItemDto, BaseItemKind, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api'
import { useMutation } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { getApi, getLibrary } from '../../../stores/auth/utils'
import { TrackQueryKeys } from '../../queries/track/keys'
import { MusicLibraryQueryKey } from '../../queries/libraries/keys'
import { QueryKeys } from '../../../enums/query-keys'
import { LoggingContext } from '../../../utils/logging'
import { setQueryUserDataForItem } from '../../queries/user-data/cache'
import { applyHapticFeedback } from '../../../utils/haptics'
import { handleError } from '../../../utils/errors'
import { setFavoriteButtonState } from '../../../services/player/utils/favorite-button'

export const FAVORITE_MUTATION_KEY = ['favorite']

interface SetFavoriteMutation {
	item: BaseItemDto
	onToggle?: () => void
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

/**
 * Marks or unmarks an item as a favorite in Jellyfin, without the UI side effects of the hooks.
 * Used by the system media controls, which toggle favorites outside of React.
 */
export async function setFavorite(item: BaseItemDto, isFavorite: boolean): Promise<void> {
	const api = getApi()

	if (isUndefined(api)) throw new Error('API instance not defined')
	if (isUndefined(item.Id)) throw new Error('Item ID is undefined')

	const { data } = isFavorite
		? await getUserDataApi(api).markFavoriteItem({ itemId: item.Id })
		: await getUserDataApi(api).unmarkFavoriteItem({ itemId: item.Id })

	onFavoriteChanged(item, data)
}

/**
 * Updates the cache and the media controls' favorite button after an item's favorite status changes
 */
function onFavoriteChanged(item: BaseItemDto, userData: UserItemDataDto | undefined): void {
	setQueryUserDataForItem(item, userData)

	// Optimized: Only invalidate the relevant query based on item type and filter state
	invalidateRelevantQueries(item)

	if (item.Type === BaseItemKind.Audio && item.Id && userData)
		setFavoriteButtonState(item.Id, userData.IsFavorite ?? false)
}

export const useAddFavorite = () => {
	return useMutation({
		mutationKey: FAVORITE_MUTATION_KEY,
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const api = getApi()

			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserDataApi(api).markFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { item, onToggle }) => {
			applyHapticFeedback('success')

			if (onToggle) onToggle()

			onFavoriteChanged(item, data?.data)
		},
		onError: (error) => {
			handleError(error, LoggingContext.Favorites, 'Failed to add favorite')
		},
	})
}

export const useRemoveFavorite = () => {
	return useMutation({
		mutationKey: FAVORITE_MUTATION_KEY,
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const api = getApi()

			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserDataApi(api).unmarkFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { item, onToggle }) => {
			applyHapticFeedback('success')

			if (onToggle) onToggle()

			onFavoriteChanged(item, data?.data)
		},
		onError: (error) => {
			handleError(error, LoggingContext.Favorites, 'Failed to remove favorite')
		},
	})
}
