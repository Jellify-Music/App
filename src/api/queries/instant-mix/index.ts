import { useApi, useJellifyUser } from '../../../../src/stores'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import InstantMixQueryKey from './keys'
import { useQuery } from '@tanstack/react-query'
import { fetchInstantMixFromItem } from './utils'

const useInstantMix = (item: BaseItemDto) => {
	const api = useApi()

	const [user] = useJellifyUser()

	return useQuery({
		queryKey: InstantMixQueryKey(item),
		queryFn: () => fetchInstantMixFromItem(api, user, item),
	})
}

export default useInstantMix
