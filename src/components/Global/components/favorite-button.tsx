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
	})

	useEffect(() => {
		refetch()
	}, [item])

	useEffect(() => {
		if (data) setFavorite(data.IsFavorite ?? false)
	}, [data])

	return isFetching && isUndefined(item.UserData) ? (
		<Spinner alignSelf='center' />
	) : (
		<Icon
			name={isFavorite ? 'heart' : 'heart-outline'}
			color={'$primary'}
			onPress={() =>
				toggleFavorite(isFavorite, {
					item,
					setFavorite,
					onToggle,
				})
			}
		/>
	)
}

export function isFavoriteItem(item: BaseItemDto): boolean {
	return isUndefined(item.UserData)
		? false
		: isUndefined(item.UserData.IsFavorite)
			? false
			: item.UserData.IsFavorite
}
