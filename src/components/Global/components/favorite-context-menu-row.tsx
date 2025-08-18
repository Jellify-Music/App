import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserData } from '../../../api/queries/favorites'
import { useJellifyContext } from '../../../providers'
import { getToken, ListItem, XStack } from 'tamagui'
import Icon from './icon'
import { useJellifyUserDataContext } from '../../../providers/UserData'
import { useEffect, useState } from 'react'
import { Text } from '../helpers/text'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

export default function FavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { api, user } = useJellifyContext()
	const { toggleFavorite } = useJellifyUserDataContext()

	const { data: userData, refetch } = useQuery({
		queryKey: [QueryKeys.UserData, item.Id],
		queryFn: () => fetchUserData(api, user, item.Id!),
		staleTime: 1000 * 60 * 60 * 1, // 1 hour,
	})

	const [isFavorite, setIsFavorite] = useState<boolean>(
		userData?.IsFavorite ?? item.UserData?.IsFavorite ?? false,
	)

	useEffect(() => {
		setIsFavorite(userData?.IsFavorite ?? false)
	}, [userData])

	return isFavorite ? (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			justifyContent='flex-start'
			onPress={() => {
				toggleFavorite(isFavorite, {
					item,
					setFavorite: setIsFavorite,
					onToggle: () => refetch(),
				})
			}}
			pressStyle={{ opacity: 0.5 }}
		>
			<Animated.View
				entering={FadeIn}
				exiting={FadeOut}
				key={`${item.Id}-remove-favorite-row`}
			>
				<XStack alignContent='center' justifyContent='flex-start' gap={'$3'}>
					<Icon name={'heart'} small color={'$primary'} />

					<Text marginTop={'$2'} bold>
						Remove from favorites
					</Text>
				</XStack>
			</Animated.View>
		</ListItem>
	) : (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			justifyContent='flex-start'
			gap={'$2'}
			onPress={() => {
				toggleFavorite(isFavorite, {
					item,
					setFavorite: setIsFavorite,
					onToggle: () => refetch(),
				})
			}}
			pressStyle={{ opacity: 0.5 }}
		>
			<Animated.View entering={FadeIn} exiting={FadeOut} key={`${item.Id}-favorite-row`}>
				<XStack alignContent='center' justifyContent='flex-start' gap={'$3'}>
					<Icon name={'heart-outline'} small color={'$primary'} />

					<Text marginTop={'$2'} bold>
						Add to favorites
					</Text>
				</XStack>
			</Animated.View>
		</ListItem>
	)
}
