import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client'

export enum ServerPluginsQueryKeys {
	All = 'ALL_SERVER_PLUGINS',
}

export const ServerPluginsQueryKey = (serverInfo?: PublicSystemInfo) => [
	ServerPluginsQueryKeys.All,
	serverInfo?.Id,
]
