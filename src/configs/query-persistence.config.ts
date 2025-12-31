import { queryClientPersister } from '../constants/storage'

const QueryPersistenceConfig = {
	persister: queryClientPersister,

	/**
	 * Maximum query data age of Infinity
	 */
	maxAge: Infinity,
}

export default QueryPersistenceConfig
