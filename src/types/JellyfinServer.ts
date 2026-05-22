import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client'

export interface JellyfinServer {
	url: string
	address: string
	name: string
	version: string
	startUpComplete: boolean
}
