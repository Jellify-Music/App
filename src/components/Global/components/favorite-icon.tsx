import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { memo } from 'react'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useIsFavorite } from '../../../api/queries/user-data'

/**
 * This component is used to display a favorite icon for a given item.
 * It is used in the {@link Track} component.
 *
 * @param item - The item to display the favorite icon for.
 * @returns A React component that displays a favorite icon for a given item.
 */
function FavoriteIcon({ item }: { item: BaseItemDto }): React.JSX.Element {
	const { data: isFavorite } = useIsFavorite(item)

	return isFavorite ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon small name='heart' color={'$primary'} />
		</Animated.View>
	) : (
		<></>
	)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FavoriteIcon, (prevProps, nextProps) => {
	// Only re-render if the item ID changes or if the initial favorite state changes
	return (
		prevProps.item.Id === nextProps.item.Id &&
		prevProps.item.UserData?.IsFavorite === nextProps.item.UserData?.IsFavorite
	)
})
