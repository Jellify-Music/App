import { UndefinedInitialDataOptions, useQuery } from '@tanstack/react-query'
import { useJellyfinServer } from '../../../hooks/auth/server'
import { PublicServerInfoQueryKey } from './keys'
import fetchPublicServerInfo from './utils'
import { ONE_DAY, queryClient } from '../../../constants/query-client'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models/public-system-info'
import { JellyfinServer } from '../../../types/JellyfinServer'
import useJellifyStore from '../../../stores/auth'

const getPublicServerInfoQuery: (
	server: JellyfinServer | undefined,
) => UndefinedInitialDataOptions<
	PublicSystemInfo,
	Error,
	PublicSystemInfo,
	(string | undefined)[]
> = (server) => ({
	queryKey: PublicServerInfoQueryKey(server),
	queryFn: fetchPublicServerInfo,
	staleTime: ONE_DAY,
})

export const usePublicServerInfo = () => {
	const [server] = useJellyfinServer()

	return useQuery({
		...getPublicServerInfoQuery(server),
		enabled: Boolean(server),
		refetchOnMount: 'always',
	})
}

export function getPublicServerInfo() {
	const server = useJellifyStore.getState().server

	return queryClient.getQueryData<PublicSystemInfo>(PublicServerInfoQueryKey(server))
}
