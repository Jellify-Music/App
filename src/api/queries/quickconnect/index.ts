import { getApi } from '../../../stores/auth/utils'
import { getQuickConnectApi } from '@jellyfin/sdk/lib/utils/api'
import { useQuery } from '@tanstack/react-query'
import { QuickConnectQueryKey } from './keys'

const useGetQuickConnectState = (secret: string) => {
	const api = getApi()

	return useQuery({
		queryKey: QuickConnectQueryKey(secret),
		queryFn: async ({ signal }) => {
			return await getQuickConnectApi(api!).getQuickConnectState(
				{
					secret,
				},
				{
					signal,
				},
			)
		},
		enabled: Boolean(api && secret),
		gcTime: 0,
		staleTime: 0,
	})
}

export default useGetQuickConnectState
