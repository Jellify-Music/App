import { useQuery } from '@tanstack/react-query'
import { ServerPluginsQueryKey } from './keys'
import { usePublicServerInfo } from '../public-server-info'
import fetchServerPlugins from './utils'
import { QueryAges } from '../../../constants/durations'

/**
 * Queries the server for installed plugins and returns the result as a React Query hook
 *
 * @returns A hook that queries the server for installed plugins
 */
const useServerPlugins = () => {
	const { data: serverInfo } = usePublicServerInfo()

	return useQuery({
		queryKey: ServerPluginsQueryKey(serverInfo),
		queryFn: ({ signal }) => fetchServerPlugins(signal),
		enabled: Boolean(serverInfo),
		staleTime: QueryAges.OneDay,
	})
}

export const useIsAudioMuseEnabled = () => {
	const pluginsResponse = useServerPlugins()

	return pluginsResponse?.data?.some((plugin) => plugin.Name === 'AudioMuse AI') ?? false
}
