import { useRef } from 'react'
import { queryClient } from '../../../constants/query-client'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { BaseItemDto, UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import Toast from 'react-native-toast-message'
import UserDataQueryKey from '../../queries/user-data/keys'
import { useAdapter, useJellifyUser } from '../../../../src/stores'
import { QueryKeys } from '../../../enums/query-keys'

interface SetFavoriteMutation {
	item: BaseItemDto
	onToggle?: () => void
}

export const useAddFavorite = () => {
	const adapter = useAdapter()
	const adapterRef = useRef(adapter)
	adapterRef.current = adapter

	const [user] = useJellifyUser()
	const qc = useQueryClient()

	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const currentAdapter = adapterRef.current
			if (isUndefined(currentAdapter)) return Promise.reject('Adapter not available')
			if (isUndefined(item.Id)) return Promise.reject('Item ID is undefined')
			await currentAdapter.star(item.Id)
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
			// Invalidate favorites queries so lists update
			qc.invalidateQueries({ queryKey: ['unified-favorites'] })
			qc.invalidateQueries({ queryKey: [QueryKeys.UserData] })
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
	const adapter = useAdapter()
	const adapterRef = useRef(adapter)
	adapterRef.current = adapter

	const [user] = useJellifyUser()
	const qc = useQueryClient()

	const trigger = useHapticFeedback()

	return useMutation({
		mutationFn: async ({ item }: SetFavoriteMutation) => {
			const currentAdapter = adapterRef.current
			if (isUndefined(currentAdapter)) return Promise.reject('Adapter not available')
			if (isUndefined(item.Id)) return Promise.reject('Item ID is undefined')
			await currentAdapter.unstar(item.Id)
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
			// Invalidate favorites queries so lists update
			qc.invalidateQueries({ queryKey: ['unified-favorites'] })
			qc.invalidateQueries({ queryKey: [QueryKeys.UserData] })
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
