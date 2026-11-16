import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api'
import { useMutation } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { getApi } from '../../../stores/auth/utils'
import { LoggingContext } from '../../../utils/logging'
import { applyHapticFeedback } from '../../../utils/haptics'
import { handleError } from '../../../utils/errors'
import { ApiNotAvailableError } from '../../../types/errors'
import { EventHandler } from '../../../types/Events'
import { onFavoriteChanged } from './utils/on-change'

export const FAVORITE_MUTATION_KEY = ['favorite']

interface SetFavoriteMutation {
	item: BaseItemDto
	onToggle?: EventHandler
}

/**
 * Marks or unmarks an item as a favorite in Jellyfin, without the UI side effects of the hooks.
 * Used by the system media controls, which toggle favorites outside of React.
 *
 * @param item The item to mark or unmark as a favorite
 * @param isFavorite Whether the item should be marked as a favorite or not
 *
 * @returns A promise that resolves when the favorite status has been updated
 */
export async function setFavorite(item: BaseItemDto, isFavorite: boolean): Promise<void> {
	const api = getApi()

	if (isUndefined(api)) throw new ApiNotAvailableError()
	if (isUndefined(item.Id)) throw new Error('Item ID is undefined')

	const { data } = isFavorite
		? await getUserDataApi(api).markFavoriteItem({ itemId: item.Id })
		: await getUserDataApi(api).unmarkFavoriteItem({ itemId: item.Id })

	onFavoriteChanged(item, data)
}

/**
 * Adds a favorite item to the user's favorites
 *
 * @param item The item to add to favorites
 *
 * @returns A mutation object for adding a favorite item
 */
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

/**
 * Removes a favorite item from the user's favorites
 *
 * @param item The item to remove from favorites
 *
 * @returns A mutation object for removing a favorite item
 */
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
