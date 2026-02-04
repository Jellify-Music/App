import { queryClient } from '../../../constants/query-client'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'
import { BaseItemDto, BaseItemKind, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { useMutation } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import UserDataQueryKey from '../../queries/user-data/keys'
import { getApi, getUser, getLibrary } from '../../../../src/stores'
import { TrackQueryKeys } from '../../queries/track/keys'
import { QueryKeys } from '../../../enums/query-keys'
import useLibraryStore from '../../../stores/library'

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
			triggerHaptic('notificationSuccess')

			const user = getUser()

			if (onToggle) onToggle()

			if (user)
				queryClient.setQueryData(UserDataQueryKey(user, item), (prev: UserItemDataDto) => {
					return {
						...prev,
						IsFavorite: true,
					}
				})

			// Optimized: Only invalidate the relevant query based on item type and filter state
			invalidateRelevantQueries(item)
		},
		onError: (error, variables) => {
			console.error('Unable to set favorite for item', error)

			triggerHaptic('notificationError')

			Toast.show({
				text1: 'Failed to add favorite',
				type: 'error',
			})
		},
	})
}

export const useRemoveFavorite = () => {
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
			triggerHaptic('notificationSuccess')

			const user = getUser()

			if (onToggle) onToggle()

			if (user)
				queryClient.setQueryData(UserDataQueryKey(user, item), (prev: UserItemDataDto) => {
					return {
						...prev,
						IsFavorite: false,
					}
				})

			// Optimized: Only invalidate the relevant query based on item type and filter state
			invalidateRelevantQueries(item)
		},
		onError: (error, variables) => {
			console.error('Unable to remove favorite for item', error)

			triggerHaptic('notificationError')

			Toast.show({
				text1: 'Failed to remove favorite',
				type: 'error',
			})
		},
	})
}
