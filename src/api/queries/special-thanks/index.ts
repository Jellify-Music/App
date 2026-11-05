import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { SPECIAL_THANKS } from '../../../configs/messaging/special-thanks'
import fetchSpecialThanks from './utils'

const useSpecialThanksQuery = () => {
	return useQuery({
		queryKey: [QueryKeys.SpecialThanks],
		queryFn: ({ signal }) => fetchSpecialThanks(signal),
		refetchOnMount: 'always',
		refetchOnWindowFocus: 'always',
	})
}

/**
 * Falls back to the bundled list while loading, offline, or if the request fails
 */
const useSpecialThanks = () => useSpecialThanksQuery().data ?? SPECIAL_THANKS

export default useSpecialThanks
