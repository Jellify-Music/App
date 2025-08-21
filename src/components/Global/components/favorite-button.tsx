import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Icon from './icon'
import { useQuery } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { Spinner } from 'tamagui'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserData } from '../../../api/queries/favorites'
import { useJellifyUserDataContext } from '../../../providers/UserData'
import { useJellifyContext } from '../../../providers'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { ONE_HOUR } from '../../../constants/query-client'

interface SetFavoriteMutation {
	item: BaseItemDto
}

export default function FavoriteButton({
	item,
	onToggle,
}: {
	item: BaseItemDto
	onToggle?: () => void
}): React.JSX.Element {
	const { api, user } = useJellifyContext()
	const { toggleFavorite } = useJellifyUserDataContext()

	const {
		data: isFavorite,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: [QueryKeys.UserData, item.Id],
		queryFn: () => fetchUserData(api, user, item.Id!),
		select: (data) => typeof data === 'object' && data.IsFavorite,
		staleTime: ONE_HOUR,
	})

	return isFetching ? (
		<Spinner alignSelf='center' />
	) : isFavorite ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart'}
				color={'$primary'}
				onPress={() =>
					toggleFavorite(isFavorite, {
						item,
						onToggle,
					})
				}
			/>
		</Animated.View>
	) : (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart-outline'}
				color={'$primary'}
				onPress={() =>
					toggleFavorite(!!isFavorite, {
						item,
						onToggle,
					})
				}
			/>
		</Animated.View>
	)
}

export function isFavoriteItem(item: BaseItemDto): boolean {
	return isUndefined(item.UserData)
		? false
		: isUndefined(item.UserData.IsFavorite)
			? false
			: item.UserData.IsFavorite
}
