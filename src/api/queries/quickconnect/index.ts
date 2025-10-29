import { useJellifyContext } from '../../../providers'
import { getQuickConnectApi } from '@jellyfin/sdk/lib/utils/api'
import { useQuery } from '@tanstack/react-query'

const useGetQuickConnectState = (secret: string) => {
	const { api } = useJellifyContext()

	return useQuery({
		queryKey: ['quickConnectState'],
		queryFn: async () => {
			return await getQuickConnectApi(api!).getQuickConnectState({ secret })
		},
		gcTime: 0,
		staleTime: 0,
	})
}

export default useGetQuickConnectState
