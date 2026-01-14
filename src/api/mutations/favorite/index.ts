import { queryClient } from '../../../constants/query-client'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { useMutation } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import UserDataQueryKey from '../../queries/user-data/keys'
import { getApi, getUser } from '../../../../src/stores'

interface SetFavoriteMutation {
	item: BaseItemDto
	onToggle?: () => void
}

interface FavoriteMutationContext {
	previousData: UserItemDataDto | undefined
}

export const useAddFavorite = () => {
	const trigger = useHapticFeedback()

	return useMutation<unknown, Error, SetFavoriteMutation, FavoriteMutationContext>({
		onMutate: async ({ item }) => {
			const user = getUser()
			if (!user) return { previousData: undefined }

			// Cancel any outgoing refetches to prevent overwriting optimistic update
			await queryClient.cancelQueries({ queryKey: UserDataQueryKey(user, item) })

			// Snapshot the previous value for rollback
			const previousData = queryClient.getQueryData<UserItemDataDto>(
				UserDataQueryKey(user, item),
			)

			// Optimistically update to the new value
			queryClient.setQueryData(UserDataQueryKey(user, item), (prev: UserItemDataDto) => ({
				...prev,
				IsFavorite: true,
			}))

			// Return context with previous value for rollback
			return { previousData }
		},
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const api = getApi()

			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserLibraryApi(api).markFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { onToggle }) => {
			trigger('notificationSuccess')

			const user = getUser()

			if (onToggle) onToggle()
		},
		onError: (error, { item }, context) => {
			console.error('Unable to set favorite for item', error)

			const user = getUser()
			// Rollback to previous value on error
			if (user && context?.previousData) {
				queryClient.setQueryData(UserDataQueryKey(user, item), context.previousData)
			}

			trigger('notificationError')

			Toast.show({
				text1: 'Failed to add favorite',
				type: 'error',
			})
		},
	})
}

export const useRemoveFavorite = () => {
	const trigger = useHapticFeedback()

	return useMutation<unknown, Error, SetFavoriteMutation, FavoriteMutationContext>({
		onMutate: async ({ item }) => {
			const user = getUser()
			if (!user) return { previousData: undefined }

			// Cancel any outgoing refetches to prevent overwriting optimistic update
			await queryClient.cancelQueries({ queryKey: UserDataQueryKey(user, item) })

			// Snapshot the previous value for rollback
			const previousData = queryClient.getQueryData<UserItemDataDto>(
				UserDataQueryKey(user, item),
			)

			// Optimistically update to the new value
			queryClient.setQueryData(UserDataQueryKey(user, item), (prev: UserItemDataDto) => ({
				...prev,
				IsFavorite: false,
			}))

			// Return context with previous value for rollback
			return { previousData }
		},
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const api = getApi()

			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserLibraryApi(api).unmarkFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { onToggle }) => {
			trigger('notificationSuccess')

			const user = getUser()

			if (onToggle) onToggle()
		},
		onError: (error, { item }, context) => {
			console.error('Unable to remove favorite for item', error)

			const user = getUser()
			// Rollback to previous value on error
			if (user && context?.previousData) {
				queryClient.setQueryData(UserDataQueryKey(user, item), context.previousData)
			}

			trigger('notificationError')

			Toast.show({
				text1: 'Failed to remove favorite',
				type: 'error',
			})
		},
	})
}
