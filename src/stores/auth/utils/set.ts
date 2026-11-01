import { queryClient } from '../../../constants/query-client'
import { PublicServerInfoQueryKey } from '../../../api/queries/public-server-info/keys'
import JellifyStore, { JellifyStoreGet, JellifyStoreSet } from '../types'

export const setServer =
	(set: JellifyStoreSet, get: JellifyStoreGet): JellifyStore['setServer'] =>
	(params) => {
		const { server: currentServer } = get()

		if (!params) {
			if (currentServer)
				queryClient.removeQueries({ queryKey: PublicServerInfoQueryKey(currentServer) })

			return set({ server: undefined })
		}

		const server = { url: params.url, address: params.address }

		queryClient.setQueryData(PublicServerInfoQueryKey(server), params.publicSystemInfo)

		set({ server })
	}
