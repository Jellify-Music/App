import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useIsFavorite } from '../../queries/user-data'
import { FAVORITE_MUTATION_KEY, useAddFavorite, useRemoveFavorite } from '.'
import { useIsMutating } from '@tanstack/react-query'

export const useToggleFavorite = (item: BaseItemDto) => {
	const { data: isFavorite, isPending: fetching } = useIsFavorite(item)

	const { mutateAsync: addToFavorites } = useAddFavorite()

	const { mutateAsync: removeFromFavorites } = useRemoveFavorite()

	// Track pending favorite mutations for this item across every hook instance,
	// so a toggle from one place (e.g. the player artwork double tap) is reflected
	// in the others (e.g. the favorite button)
	const toggling =
		useIsMutating({
			mutationKey: FAVORITE_MUTATION_KEY,
			predicate: (mutation) =>
				(mutation.state.variables as { item?: BaseItemDto } | undefined)?.item?.Id ===
				item.Id,
		}) > 0

	const toggleFavorite = async ({
		item,
		onToggle,
	}: {
		item: BaseItemDto
		onToggle?: () => void
	}) => {
		if (isFavorite) {
			await removeFromFavorites({ item, onToggle })
		} else {
			await addToFavorites({ item, onToggle })
		}
	}

	return {
		isFavorite,
		isPending: fetching || toggling,
		toggleFavorite,
	}
}
