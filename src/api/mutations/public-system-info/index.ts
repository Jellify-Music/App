import { useMutation } from '@tanstack/react-query'
import { connectToServer } from './utils'
import { JellyfinServer } from '@/src/types/JellyfinServer'
import serverAddressContainsProtocol from './utils/parsing'
import HTTPS, { HTTP } from '../../../constants/protocols'
import useJellifyStore from '../../../stores/auth'
import { captureError, LoggingContext } from '../../../utils/logging'

interface PublicSystemInfoMutation {
	serverAddress: string
}

interface PublicSystemInfoHook {
	onSuccess?: (server: JellyfinServer) => void
	onError?: (error: Error) => void
}

const usePublicSystemInfo = ({ onSuccess, onError }: PublicSystemInfoHook) => {
	const setServer = useJellifyStore((state) => state.setServer)

	return useMutation({
		mutationFn: ({ serverAddress }: PublicSystemInfoMutation) =>
			connectToServer(serverAddress!),
		onSuccess: ({ publicSystemInfoResponse, connectionType }, { serverAddress }) => {
			if (!publicSystemInfoResponse.Version)
				throw new Error(`Jellyfin instance did not respond`)

			const server: JellyfinServer = {
				url:
					connectionType === 'hostname'
						? `${serverAddressContainsProtocol(serverAddress) ? '' : HTTPS}${serverAddress!}`
						: publicSystemInfoResponse.LocalAddress!,
				address: serverAddress!,
				name: publicSystemInfoResponse.ServerName!,
				version: publicSystemInfoResponse.Version!,
				startUpComplete: publicSystemInfoResponse.StartupWizardCompleted!,
			}

			setServer(server)

			if (onSuccess) onSuccess(server)
		},
		onError: (error: Error) => {
			captureError(
				error,
				LoggingContext.PublicSystemInfo,
				'An error occurred connecting to the Jellyfin instance',
			)

			setServer(undefined)

			if (onError) onError(error)
		},
	})
}

export default usePublicSystemInfo
