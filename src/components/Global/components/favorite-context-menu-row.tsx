import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserData } from '../../../api/queries/favorites'
import { useJellifyContext } from '../../../providers'
import { ListItem, XStack } from 'tamagui'
import Icon from './icon'
import { useJellifyUserDataContext } from '../../../providers/UserData'
import { Text } from '../helpers/text'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { ONE_HOUR } from '../../../constants/query-client'

export default function FavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { api, user } = useJellifyContext()
	const { toggleFavorite } = useJellifyUserDataContext()

	const { data: isFavorite, refetch } = useQuery({
		queryKey: [QueryKeys.UserData, item.Id],
		queryFn: () => fetchUserData(api, user, item.Id!),
		select: (data) => typeof data === 'object' && data.IsFavorite,
		staleTime: ONE_HOUR,
	})

	return isFavorite ? (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			justifyContent='flex-start'
			onPress={() => {
				toggleFavorite(isFavorite, {
					item,
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
				<XStack alignItems='center' justifyContent='flex-start' gap={'$2'}>
					<Icon name={'heart'} small color={'$primary'} />

					<Text bold>Remove from favorites</Text>
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
				toggleFavorite(!!isFavorite, {
					item,
					onToggle: () => refetch(),
				})
			}}
			pressStyle={{ opacity: 0.5 }}
		>
			<Animated.View entering={FadeIn} exiting={FadeOut} key={`${item.Id}-favorite-row`}>
				<XStack alignItems='center' justifyContent='flex-start' gap={'$2'}>
					<Icon small name={'heart-outline'} color={'$primary'} />

					<Text bold>Add to favorites</Text>
				</XStack>
			</Animated.View>
		</ListItem>
	)
}
