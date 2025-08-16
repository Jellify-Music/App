import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Spacer } from 'tamagui'
import Icon from './icon'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserData } from '../../../api/queries/favorites'
import { useEffect, useState, memo } from 'react'
import { useJellifyContext } from '../../../providers'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

/**
 * This component is used to display a favorite icon for a given item.
 * It is used in the {@link Track} component.
 *
 * @param item - The item to display the favorite icon for.
 * @returns A React component that displays a favorite icon for a given item.
 */
function FavoriteIcon({ item }: { item: BaseItemDto }): React.JSX.Element {
	const [isFavorite, setIsFavorite] = useState<boolean>(item.UserData?.IsFavorite ?? false)

	const { api, user } = useJellifyContext()

	const { data: userData, isPending } = useQuery({
		queryKey: [QueryKeys.UserData, item.Id!],
		queryFn: () => fetchUserData(api, user, item.Id!),
		staleTime: 1000 * 60 * 5, // 5 minutes,
		enabled: !!api && !!user && !!item.Id, // Only run if we have the required data
	})

	useEffect(() => {
		if (!isPending && userData !== undefined) {
			setIsFavorite(userData?.IsFavorite ?? false)
		}
	}, [userData, isPending])

	return isFavorite ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon small name='heart' color={'$primary'} flex={1} />
		</Animated.View>
	) : (
		<Spacer flex={0.5} />
	)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FavoriteIcon, (prevProps, nextProps) => {
	// Only re-render if the item ID changes or if the initial favorite state changes
	return (
		prevProps.item.Id === nextProps.item.Id &&
		prevProps.item.UserData?.IsFavorite === nextProps.item.UserData?.IsFavorite
	)
})
