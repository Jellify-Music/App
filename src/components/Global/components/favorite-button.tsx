import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import Icon from './icon'
import { isUndefined } from 'lodash'
import { useJellifyUserDataContext } from '../../../providers/UserData'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useIsFavorite } from '../../../api/queries/user-data'

interface FavoriteButtonProps {
	item: BaseItemDto
	onToggle?: () => void
}

export default function FavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { toggleFavorite } = useJellifyUserDataContext()

	const { data: isFavorite } = useIsFavorite(item)

	return isFavorite ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart'}
				color={'$primary'}
				onPress={() =>
					toggleFavorite(isFavorite, {
						item,
						onToggle,
					})
				}
			/>
		</Animated.View>
	) : (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon
				name={'heart-outline'}
				color={'$primary'}
				onPress={() =>
					toggleFavorite(!!isFavorite, {
						item,
						onToggle,
					})
				}
			/>
		</Animated.View>
	)
}

export function isFavoriteItem(item: BaseItemDto): boolean {
	return isUndefined(item.UserData)
		? false
		: isUndefined(item.UserData.IsFavorite)
			? false
			: item.UserData.IsFavorite
}
