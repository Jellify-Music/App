import { queryClient } from '../../../constants/query-client'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { useMutation } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { getApi, getUser, getLibrary } from '../../../stores/auth/utils'
import { TrackQueryKeys } from '../../queries/track/keys'
import { QueryKeys } from '../../../enums/query-keys'
import { captureError, LoggingContext } from '../../../utils/logging'
import { setQueryUserDataForItem } from '../../queries/user-data'
import { applyHapticFeedback } from '../../../utils/haptics'
import { useErrorToast } from '../../../hooks/toasts'

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
	const library = getLibrary()

	// Only invalidate if favorites filter is active, or always invalidate favorites-filtered queries
	// (so they're fresh when user turns on filter later)
	if (!library) return

	const libraryId = library.musicLibraryId

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

export const useAddFavorite = () => {
	const toast = useErrorToast()

	return useMutation({
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const api = getApi()

			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserLibraryApi(api).markFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { item, onToggle }) => {
			applyHapticFeedback('success')

			const user = getUser()

			if (onToggle) onToggle()

			if (user) setQueryUserDataForItem(item, data?.data)

			// Optimized: Only invalidate the relevant query based on item type and filter state
			invalidateRelevantQueries(item)
		},
		onError: (error, variables) => {
			captureError(error, LoggingContext.Favorites, 'Unable to set favorite for item')

			applyHapticFeedback('error')

			toast({
				title: 'Failed to add favorite',
			})
		},
	})
}

export const useRemoveFavorite = () => {
	const toast = useErrorToast()

	return useMutation({
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const api = getApi()

			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserLibraryApi(api).unmarkFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { item, onToggle }) => {
			applyHapticFeedback('success')

			if (onToggle) onToggle()

			setQueryUserDataForItem(item, data?.data)

			// Optimized: Only invalidate the relevant query based on item type and filter state
			invalidateRelevantQueries(item)
		},
		onError: (error, variables) => {
			captureError(error, LoggingContext.Favorites, 'Unable to remove favorite for item')

			applyHapticFeedback('error')

			toast({
				title: 'Failed to remove favorite',
			})
		},
	})
}
