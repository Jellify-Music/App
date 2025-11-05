import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React, { useCallback } from 'react'
import Icon from './icon'
import Animated, { BounceIn, FadeIn, FadeOut } from 'react-native-reanimated'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'
import { useIsFavorite } from '../../../api/queries/user-data'
import { getTokenValue, Spinner } from 'tamagui'

interface FavoriteButtonProps {
	item: BaseItemDto
	onToggle?: () => void
}

export default function FavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { data: isFavorite, isPending } = useIsFavorite(item)

	return isPending ? (
		<Spinner color={'$primary'} width={34 + getTokenValue('$0.5')} height={'$1'} />
	) : isFavorite ? (
		<AddFavoriteButton item={item} onToggle={onToggle} />
	) : (
		<RemoveFavoriteButton item={item} onToggle={onToggle} />
	)
}

function AddFavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { mutate, isPending } = useRemoveFavorite()

	return isPending ? (
		<Spinner color={'$primary'} width={34 + getTokenValue('$0.5')} height={'$1'} />
	) : (
		<Animated.View entering={BounceIn} exiting={FadeOut}>
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
		<Spinner color={'$primary'} width={34 + getTokenValue('$0.5')} height={'$1'} />
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
