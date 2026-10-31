import { SetJellyfinServerParams } from '../../../stores/auth/types'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client'

export type PublicSystemInfoMutation = {
	serverAddress: string
}

export type ConnectToServerParams = {
	onSuccess?: (result: SetJellyfinServerParams) => void
	onError?: (error: Error) => void
}

export type ConnectToServerResult = {
	publicSystemInfoResponse: PublicSystemInfo
	resolvedUrl: string
}
