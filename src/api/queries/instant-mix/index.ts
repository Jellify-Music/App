import { useApi, useJellifyUser } from '../../../stores/auth'
import InstantMixQueryKey from './keys'
import { useQuery } from '@tanstack/react-query'
import { fetchInstantMixFromItem } from './utils'
import { useInstantMixContext, InstantMixProvider } from '../../../providers/InstantMix'

/**
 * A query hook that returns the result of an Instant Mix
 *
 * Depends on the component being nested in a {@link InstantMixProvider}, which
 * contains the item to refer to when mixing.
 *
 * @returns The result of the Instant Mix query
 */
const useInstantMix = () => {
	const api = useApi()

	const [user] = useJellifyUser()

	const { item } = useInstantMixContext()

	return useQuery({
		queryKey: InstantMixQueryKey(item),
		queryFn: ({ signal }) => fetchInstantMixFromItem(api, user, item, signal),
	})
}

export default useInstantMix
