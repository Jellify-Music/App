import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ListItem, XStack } from 'tamagui'
import Icon from './icon'
import { Text } from '../helpers/text'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useIsFavorite } from '../../../api/queries/user-data'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'

export default function FavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { data: isFavorite } = useIsFavorite(item)

	return isFavorite ? (
		<RemoveFavoriteContextMenuRow item={item} />
	) : (
		<AddFavoriteContextMenuRow item={item} />
	)
}

function AddFavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { mutate, isPending } = useAddFavorite()

	return (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			justifyContent='flex-start'
			onPress={() => {
				mutate({ item })
			}}
			pressStyle={{ opacity: 0.5 }}
			disabled={isPending}
		>
			<Animated.View entering={FadeIn} exiting={FadeOut} key={`${item.Id}-favorite-row`}>
				<XStack alignItems='center' justifyContent='flex-start' gap={'$2.5'}>
					<Icon small name={'heart-outline'} color={'$primary'} />

					<Text bold>Add to favorites</Text>
				</XStack>
			</Animated.View>
		</ListItem>
	)
}

function RemoveFavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { mutate, isPending } = useRemoveFavorite()

	return (
		<ListItem
			animation={'quick'}
			backgroundColor={'transparent'}
			justifyContent='flex-start'
			onPress={() => {
				mutate({ item })
			}}
			pressStyle={{ opacity: 0.5 }}
			disabled={isPending}
		>
			<Animated.View entering={FadeIn} exiting={FadeOut} key={`${item.Id}-favorite-row`}>
				<XStack alignItems='center' justifyContent='flex-start' gap={'$2.5'}>
					<Icon small name={'heart'} color={'$primary'} />

					<Text bold>Remove from favorites</Text>
				</XStack>
			</Animated.View>
		</ListItem>
	)
}
