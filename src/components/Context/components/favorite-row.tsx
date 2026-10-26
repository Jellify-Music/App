import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { AnimatePresence, ListItem, SizableText, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { useIsFavorite } from '../../../api/queries/user-data'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'

export default function FavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { data: isFavorite } = useIsFavorite(item)

	return (
		<AnimatePresence initial={false}>
			{isFavorite ? (
				<RemoveFavoriteContextMenuRow item={item} />
			) : (
				<AddFavoriteContextMenuRow item={item} />
			)}
		</AnimatePresence>
	)
}

function AddFavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { mutate, isPending } = useAddFavorite()

	return (
		<ListItem
			transition={'quick'}
			backgroundColor={'transparent'}
			justifyContent='flex-start'
			opacity='1 press:0.5 enter:0 exit:0'
			onPress={() => {
				mutate({ item })
			}}
			disabled={isPending}
		>
			<AnimatePresence>
				<XStack alignItems='center' justifyContent='flex-start' gap='3'>
					<Icon size={'7'} name={'heart-outline'} color={'primary'} />

					<SizableText fontSize={'3'} fontWeight='6'>
						Add to favorites
					</SizableText>
				</XStack>
			</AnimatePresence>
		</ListItem>
	)
}

function RemoveFavoriteContextMenuRow({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { mutate, isPending } = useRemoveFavorite()

	return (
		<ListItem
			transition={'quick'}
			backgroundColor={'transparent'}
			justifyContent='flex-start'
			opacity='1 press:0.5 enter:0 exit:0'
			onPress={() => {
				mutate({ item })
			}}
			disabled={isPending}
		>
			<XStack alignItems='center' justifyContent='flex-start' gap='3'>
				<Icon size={'7'} name={'heart'} color={'primary'} />

				<SizableText fontSize={'3'} fontWeight='6'>
					Remove from favorites
				</SizableText>
			</XStack>
		</ListItem>
	)
}
