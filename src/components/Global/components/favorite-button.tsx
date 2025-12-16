import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Icon from './icon'
import Animated, { BounceIn, FadeIn, FadeOut } from 'react-native-reanimated'
import { useStar, useUnstar } from '../../../hooks/adapter/useFavorites'
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
		<RemoveFromFavorites item={item} onToggle={onToggle} />
	) : (
		<AddToFavorites item={item} onToggle={onToggle} />
	)
}

function RemoveFromFavorites({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { mutate, isPending } = useUnstar()

	return isPending ? (
		<Spinner color={'$primary'} width={34 + getTokenValue('$0.5')} height={'$1'} />
	) : (
		<Animated.View entering={BounceIn} exiting={FadeOut}>
			<Icon
				name={'heart'}
				color={'$primary'}
				onPress={() => {
					if (item.Id) {
						mutate(item.Id)
						onToggle?.()
					}
				}}
			/>
		</Animated.View>
	)
}

function AddToFavorites({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { mutate, isPending } = useStar()

	return isPending ? (
		<Spinner color={'$primary'} width={34 + getTokenValue('$0.5')} height={'$1'} />
	) : (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart-outline'}
				color={'$primary'}
				onPress={() => {
					if (item.Id) {
						mutate(item.Id)
						onToggle?.()
					}
				}}
			/>
		</Animated.View>
	)
}
