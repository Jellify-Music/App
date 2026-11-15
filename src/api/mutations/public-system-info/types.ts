import { SetJellyfinServerParams } from '../../../stores/auth/types'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client'

export type PublicSystemInfoMutation = {
	serverAddress: string
}

export type ConnectToServerParams = {
	onSuccess?: (result: SetJellyfinServerParams) => void
}

export type ConnectToServerResult = {
	publicSystemInfoResponse: PublicSystemInfo
	resolvedUrl: string
}
