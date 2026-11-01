import { useMutation } from '@tanstack/react-query'
import { connectToServer } from './utils'
import type { SetServerParams } from '../../../stores/auth/types'
import { captureError, LoggingContext } from '../../../utils/logging'
import useJellifyStore from '../../../stores/auth'
import type {
	ConnectToServerParams,
	PublicSystemInfoMutation,
	ConnectToServerResult,
} from './types'

const useConnectToServer = ({ onSuccess, onError }: ConnectToServerParams) =>
	useMutation<ConnectToServerResult, Error, PublicSystemInfoMutation>({
		mutationFn: ({ serverAddress }) => connectToServer(serverAddress),
		onSuccess: ({ publicSystemInfoResponse, resolvedUrl }, { serverAddress }) => {
			if (!publicSystemInfoResponse.Version)
				throw new Error(`Jellyfin instance did not respond`)

			if (!publicSystemInfoResponse.StartupWizardCompleted)
				throw new Error(`Server has not been set up yet`)

			const server: SetServerParams = {
				url: resolvedUrl,
				address: serverAddress,
				publicSystemInfo: publicSystemInfoResponse,
			}

			useJellifyStore.getState().setServer(server)

			onSuccess?.(server)
		},
		onError: (error: Error) => {
			captureError(
				error,
				LoggingContext.PublicSystemInfo,
				'An error occurred connecting to the Jellyfin instance',
			)

			useJellifyStore.getState().setServer(undefined)

			onError?.(error)
		},
	})

export default useConnectToServer
