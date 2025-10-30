import { queryClient } from '../../../constants/query-client'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { useJellifyContext } from '../../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { useMutation } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import UserDataQueryKey from '../../queries/user-data/keys'

interface SetFavoriteMutation {
	item: BaseItemDto
	onToggle?: () => void
}

export const useAddFavorite = () => {
	const { api, user } = useJellifyContext()

	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserLibraryApi(api).markFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { item, onToggle }) => {
			Toast.show({
				text1: 'Added favorite',
				type: 'success',
			})

			trigger('notificationSuccess')

			if (onToggle) onToggle()

			queryClient.invalidateQueries({ queryKey: UserDataQueryKey(user!, item) })
		},
		onError: (error, variables) => {
			console.error('Unable to set favorite for item', error)

			trigger('notificationError')

			Toast.show({
				text1: 'Failed to add favorite',
				type: 'error',
			})
		},
	})
}

export const useRemoveFavorite = () => {
	const { api, user } = useJellifyContext()

	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			if (isUndefined(api)) Promise.reject('API instance not defined')
			else if (isUndefined(item.Id)) Promise.reject('Item ID is undefined')
			else
				return await getUserLibraryApi(api).unmarkFavoriteItem({
					itemId: item.Id,
				})
		},
		onSuccess: (data, { item, onToggle }) => {
			Toast.show({
				text1: 'Removed favorite',
				type: 'success',
			})

			trigger('notificationSuccess')

			if (onToggle) onToggle()

			queryClient.invalidateQueries({ queryKey: UserDataQueryKey(user!, item) })
		},
		onError: (error, variables) => {
			console.error('Unable to remove favorite for item', error)

			trigger('notificationError')

			Toast.show({
				text1: 'Failed to remove favorite',
				type: 'error',
			})
		},
	})
}
