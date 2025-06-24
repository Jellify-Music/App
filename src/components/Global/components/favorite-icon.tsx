import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getToken, Spacer, YStack } from 'tamagui'
import Icon from './icon'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserData } from '../../../api/queries/favorites'
import { useEffect, useState } from 'react'
import { useJellifyContext } from '../../../providers'

/**
 * This component is used to display a favorite icon for a given item.
 * It is used in the {@link Track} component.
 *
 * @param item - The item to display the favorite icon for.
 * @returns A React component that displays a favorite icon for a given item.
 */
export default function FavoriteIcon({ item }: { item: BaseItemDto }): React.JSX.Element {
	const [isFavorite, setIsFavorite] = useState<boolean>(item.UserData?.IsFavorite ?? false)
	const { api, user, library } = useJellifyContext()
	const { data: userData } = useQuery({
		queryKey: [QueryKeys.UserData, item.Id!],
		queryFn: () => fetchUserData(api, user, item.Id!),
		staleTime: 1000 * 60 * 5, // 5 minutes,
	})

	useEffect(() => {
		setIsFavorite(userData?.IsFavorite ?? false)
	}, [userData])

	return isFavorite ? (
		<Icon small name='heart' color={'$primary'} flex={2} />
	) : (
		<Spacer flex={1} />
	)
}
