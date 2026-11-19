import { JellyfinServer } from '@/src/types/JellyfinServer'

export enum PublicServerInfoKeys {
	PUBLIC_SERVER_INFO = 'PUBLIC_SERVER_INFO',
}

export const PublicServerInfoQueryKey = (server?: JellyfinServer) => [
	PublicServerInfoKeys.PUBLIC_SERVER_INFO,
	server?.url,
]
