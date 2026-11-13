import { useIsFavorite } from '../../../../api/queries/user-data'
import { useAddFavorite, useRemoveFavorite } from '../../../../api/mutations/favorite'
import FavoriteContextMenuRowProps from './types'
import type { ContextMenuRowImageProp } from '../types'
import ContextMenuRow from '..'

const ADD_FAVORITE_IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'heart-outline',
}

const REMOVE_FAVORITE_IMAGE_PROP: ContextMenuRowImageProp = {
	iconName: 'heart',
}

export default function FavoriteContextMenuRow({
	item,
}: FavoriteContextMenuRowProps): React.JSX.Element {
	const { data: isFavorite } = useIsFavorite(item)

	return isFavorite ? (
		<RemoveFavoriteContextMenuRow item={item} />
	) : (
		<AddFavoriteContextMenuRow item={item} />
	)
}

function AddFavoriteContextMenuRow({ item }: FavoriteContextMenuRowProps): React.JSX.Element {
	const { mutate, isPending } = useAddFavorite()

	return (
		<ContextMenuRow
			onPress={() => mutate({ item })}
			disabled={isPending}
			imageProp={ADD_FAVORITE_IMAGE_PROP}
			label='Add to favorites'
		/>
	)
}

function RemoveFavoriteContextMenuRow({ item }: FavoriteContextMenuRowProps): React.JSX.Element {
	const { mutate, isPending } = useRemoveFavorite()

	return (
		<ContextMenuRow
			onPress={() => mutate({ item })}
			disabled={isPending}
			imageProp={REMOVE_FAVORITE_IMAGE_PROP}
			label='Remove from favorites'
		/>
	)
}
