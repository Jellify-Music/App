import { OmitKeyof } from '@tanstack/react-query'
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { queryClientPersister } from '../constants/storage'

const QueryPersistenceConfig: OmitKeyof<PersistQueryClientOptions, 'queryClient'> = {
	persister: queryClientPersister,

	/**
	 * Maximum query data age of Infinity
	 */
	maxAge: Infinity,
}

export default QueryPersistenceConfig
