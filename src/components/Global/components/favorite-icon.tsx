import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useIsFavorite } from '../../../api/queries/user-data'

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
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
		>
			<Icon small name='heart' color={'$primary'} />
		</Animated.View>
	) : (
		<></>
	)
}
