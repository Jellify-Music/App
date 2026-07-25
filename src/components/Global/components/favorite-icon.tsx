import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { useIsFavorite } from '../../../api/queries/user-data'

/**
 * This component is used to display a favorite icon for a given item.
 * It is used in the {@link Track} component.
 *
 * @param item - The item to display the favorite icon for.
 * @returns A React component that displays a favorite icon for a given item.
 */
export default function FavoriteIcon({ item }: { item: BaseItemDto }) {
	const { data: isFavorite } = useIsFavorite(item)

	return (
		isFavorite && (
			<Icon
				xsmall
				name='heart'
				color={'$primary'}
				transition={'lazy'}
				enterStyle={{
					opacity: 0,
				}}
				exitStyle={{
					opacity: 0,
				}}
			/>
		)
	)
}
