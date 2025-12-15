import { ServerBackend } from '../api/core/types'

export interface JellifyServer {
	url: string
	address: string
	name: string
	version: string
	startUpComplete: boolean
	/** The backend type: 'jellyfin' or 'navidrome' */
	backend: ServerBackend
}
