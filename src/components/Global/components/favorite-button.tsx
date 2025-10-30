import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React, { useCallback } from 'react'
import Icon from './icon'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'
import { useIsFavorite } from '../../../api/queries/user-data'
import { Spinner } from 'tamagui'

interface FavoriteButtonProps {
	item: BaseItemDto
	onToggle?: () => void
}

export default function FavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { data: isFavorite, refetch } = useIsFavorite(item)

	const callback = useCallback(() => {
		refetch()
		if (onToggle) onToggle()
	}, [refetch, onToggle])

	return isFavorite ? (
		<AddFavoriteButton item={item} onToggle={callback} />
	) : (
		<RemoveFavoriteButton item={item} onToggle={callback} />
	)
}

function AddFavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { mutate, isPending } = useRemoveFavorite()

	return isPending ? (
		<Spinner color={'$primary'} width={'$2.5'} height={'$2'} />
	) : (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart'}
				color={'$primary'}
				onPress={() =>
					mutate({
						item,
						onToggle,
					})
				}
			/>
		</Animated.View>
	)
}

function RemoveFavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { mutate, isPending } = useAddFavorite()

	return isPending ? (
		<Spinner color={'$primary'} width={'$2.5'} height={'$2'} />
	) : (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart-outline'}
				color={'$primary'}
				onPress={() =>
					mutate({
						item,
						onToggle,
					})
				}
			/>
		</Animated.View>
	)
}
