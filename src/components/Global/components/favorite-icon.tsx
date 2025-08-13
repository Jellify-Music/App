import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Spacer } from 'tamagui'
import Icon from './icon'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserData } from '../../../api/queries/favorites'
import { useEffect, useState } from 'react'
import { useJellifyContext } from '../../../providers'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

/**
 * This component is used to display a favorite icon for a given item.
 * It is used in the {@link Track} component.
 *
 * @param item - The item to display the favorite icon for.
 * @returns A React component that displays a favorite icon for a given item.
 */
export default function FavoriteIcon({ item }: { item: BaseItemDto }): React.JSX.Element {
	const [isFavorite, setIsFavorite] = useState<boolean>(item.UserData?.IsFavorite ?? false)

	const { api, user } = useJellifyContext()

	const { data: userData, isPending } = useQuery({
		queryKey: [QueryKeys.UserData, item.Id!],
		queryFn: () => fetchUserData(api, user, item.Id!),
		staleTime: 1000 * 60 * 60 * 1, // 1 hour,
	})

	useEffect(() => {
		if (!isPending) setIsFavorite(userData?.IsFavorite ?? false)
	}, [userData, isPending])

	return isFavorite ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon small name='heart' color={'$primary'} flex={1} />
		</Animated.View>
	) : (
		<Spacer flex={0.5} />
	)
}
