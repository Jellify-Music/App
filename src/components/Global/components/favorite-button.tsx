import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import React from 'react'
import { useToggleFavorite } from '../../../api/mutations/favorite/toggle'
import Icon from './icon'
import { AnimatePresence, getTokenValue, Spinner } from 'tamagui'

interface FavoriteButtonProps {
	item: BaseItemDto
	onToggle?: () => void
}

export default function FavoriteButton({ item, onToggle }: FavoriteButtonProps): React.JSX.Element {
	const { isFavorite, isPending, toggleFavorite } = useToggleFavorite(item)

	const onPress = () => {
		toggleFavorite({
			item,
			onToggle,
		})
	}

	const iconName = isFavorite ? 'heart' : 'heart-outline'

	return isPending ? (
		<Spinner
			key='favorite-spinner'
			color='primary'
			width={34 + getTokenValue('0-5')}
			height='1'
		/>
	) : (
		<AnimatePresence initial={false} mode='wait'>
			<Icon
				key={iconName}
				size='8'
				name={iconName}
				color={'primary'}
				onPress={onPress}
				transition='bouncy'
				scale='1 enter:0'
			/>
		</AnimatePresence>
	)
}
