import { queryClient } from '../../../constants/query-client'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { useMutation } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import UserDataQueryKey from '../../queries/user-data/keys'
import { useApi, useJellifyUser } from '../../../../src/stores'

interface SetFavoriteMutation {
	item: BaseItemDto
	onToggle?: () => void
}

export const useAddFavorite = () => {
	const api = useApi()
	const [user] = useJellifyUser()

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
			trigger('notificationSuccess')

			if (onToggle) onToggle()

			if (user)
				queryClient.setQueryData(UserDataQueryKey(user, item), (prev: UserItemDataDto) => {
					return {
						...prev,
						IsFavorite: true,
					}
				})
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
	const api = useApi()
	const [user] = useJellifyUser()

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
			trigger('notificationSuccess')

			if (onToggle) onToggle()

			if (user)
				queryClient.setQueryData(UserDataQueryKey(user, item), (prev: UserItemDataDto) => {
					return {
						...prev,
						IsFavorite: false,
					}
				})
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
