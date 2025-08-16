import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React, { useEffect, useState } from 'react'
import Icon from './icon'
import { useQuery } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { getTokens, Spinner } from 'tamagui'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserData } from '../../../api/queries/favorites'
import { useJellifyUserDataContext } from '../../../providers/UserData'
import { useJellifyContext } from '../../../providers'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

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
	const [isFavorite, setFavorite] = useState<boolean>(isFavoriteItem(item))

	const { api, user } = useJellifyContext()
	const { toggleFavorite } = useJellifyUserDataContext()

	const { data, isFetching, refetch } = useQuery({
		queryKey: [QueryKeys.UserData, item.Id!],
		queryFn: () => fetchUserData(api, user, item.Id!),
		staleTime: 1000 * 60 * 60 * 1, // 1 hour,
	})

	useEffect(() => {
		refetch()
	}, [item])

	useEffect(() => {
		if (data) setFavorite(data.IsFavorite ?? false)
	}, [data])

	return isFetching && isUndefined(item.UserData) ? (
		<Spinner alignSelf='center' />
	) : isFavorite ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart'}
				color={'$primary'}
				onPress={() =>
					toggleFavorite(isFavorite, {
						item,
						setFavorite,
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
					toggleFavorite(isFavorite, {
						item,
						setFavorite,
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
