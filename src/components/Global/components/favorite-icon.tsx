import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { useIsFavorite } from '../../../api/queries/user-data'
import { Easing, FadeIn, FadeOut } from 'react-native-reanimated'

/**
 * This component is used to display a favorite icon for a given item.
 * It is used in the {@link Track} component.
 *
 * @param item - The item to display the favorite icon for.
 * @returns A React component that displays a favorite icon for a given item.
 */
export default function FavoriteIcon({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { data: isFavorite } = useIsFavorite(item)

	return isFavorite ? (
		<Icon
			xsmall
			name='heart'
			color={'$primary'}
			entering={FadeIn.easing(Easing.ease)}
			exiting={FadeOut.easing(Easing.ease)}
		/>
	) : (
		<></>
	)
}
