import { OmitKeyof } from '@tanstack/react-query'
import { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import { queryClientPersister } from '../constants/storage'
import { ONE_DAY } from '../constants/query-client'

const QueryPersistenceConfig: OmitKeyof<PersistQueryClientOptions, 'queryClient'> = {
	persister: queryClientPersister,

	/**
	 * Maximum query data age of ONE_DAY, after which the data will be garbage collected from the persistence layer
	 */
	maxAge: ONE_DAY,
}

export default QueryPersistenceConfig
