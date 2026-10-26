import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Icon from './icon'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'
import { useIsFavorite } from '../../../api/queries/user-data'
import { AnimatePresence, getTokenValue, Spinner } from 'tamagui'

interface FavoriteButtonProps {
	item: BaseItemDto
	onToggle?: () => void
}

export default function FavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { data: isFavorite, isPending } = useIsFavorite(item)

	return isPending ? (
		<Spinner color='primary' width={34 + getTokenValue('0-5')} height='1' />
	) : isFavorite ? (
		<AddFavoriteButton item={item} onToggle={onToggle} />
	) : (
		<RemoveFavoriteButton item={item} onToggle={onToggle} />
	)
}

function AddFavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { mutate, isPending } = useRemoveFavorite()

	return isPending ? (
		<Spinner color='primary' width={34 + getTokenValue('0-5')} height='1' />
	) : (
		<AnimatePresence initial={false}>
			<Icon
				size='8'
				name={'heart'}
				color={'primary'}
				onPress={() =>
					mutate({
						item,
						onToggle,
					})
				}
				transition='bouncy'
				scale='1 enter:0 exit:0'
			/>
		</AnimatePresence>
	)
}

function RemoveFavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { mutate, isPending } = useAddFavorite()

	return isPending ? (
		<Spinner color='primary' width={34 + getTokenValue('0-5')} height='1' />
	) : (
		<AnimatePresence initial={false}>
			<Icon
				name={'heart-outline'}
				color={'primary'}
				onPress={() =>
					mutate({
						item,
						onToggle,
					})
				}
				transition='medium'
				opacity='1 enter:0 exit:0'
			/>
		</AnimatePresence>
	)
}
