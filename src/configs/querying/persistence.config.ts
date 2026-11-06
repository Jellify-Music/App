import { OmitKeyof } from '@tanstack/react-query'
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { queryClientPersister } from '../../constants/storage'

const QueryPersistenceConfig: OmitKeyof<PersistQueryClientOptions, 'queryClient'> = {
	persister: queryClientPersister,

	/**
	 * Maximum query data age of Infinity, disabling garbage collection from the persistence layer
	 * by default. This ensures that persisted query data is retained indefinitely unless manually cleared.
	 */
	maxAge: Infinity,
}

export default QueryPersistenceConfig
