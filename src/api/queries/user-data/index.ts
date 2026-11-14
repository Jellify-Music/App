import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useQuery } from '@tanstack/react-query'
import { QueryAges } from '../../../constants/durations'
import fetchUserData from './utils'
import UserDataQueryKey from './keys'
import { getUser } from '../../../stores/auth/utils'

/**
 * Whether an item is a favorite.
 *
 * Items from list queries already carry `UserData`, so those only observe the cache (where favorite
 * mutations and the context sheet prefetch write fresher values) and never fetch or seed an entry.
 * Seeding one per rendered row grew the persisted cache by an entry for every track ever scrolled
 * past, and refetched every visible row once the entries went stale.
 */
export const useIsFavorite = (item: BaseItemDto) => {
	const user = getUser()

	const hasItemUserData = Boolean(item.UserData)

	const { data: cachedIsFavorite, isPending } = useQuery({
		queryKey: UserDataQueryKey(user!, item.Id!),
		queryFn: ({ signal }) => fetchUserData(item.Id!, signal),
		select: ({ IsFavorite }) => IsFavorite || false,
		enabled: Boolean(item.Id) && !hasItemUserData,
		staleTime: QueryAges.OneHour / 4,
	})

	return {
		data:
			cachedIsFavorite ??
			(hasItemUserData ? (item.UserData?.IsFavorite ?? false) : undefined),
		isPending: isPending && !hasItemUserData,
	}
}
